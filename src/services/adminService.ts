import { supabase, USER_PROFILES_TABLE, type UserProfile, type UserRole } from '@/lib/supabaseClient';
import type {
  AdminCustomHospital,
  AdminInvitationCode,
  AdminJobPost,
  AdminKemiPost,
  AdminPrivateAmbulance,
  AdminUserActivity,
  AdminUserRow,
  AdminVerificationRow,
} from '@/types/admin';

export class AdminServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminServiceError';
  }
}

function parseRpcError(message: string, fn?: string): string {
  const prefix = fn ? `[${fn}] ` : '';
  if (message.includes('not_authorized_admin')) {
    return '승인된 관리자 계정만 이 작업을 수행할 수 있습니다.';
  }
  if (message.includes('cannot_block_self')) {
    return '본인 계정은 차단할 수 없습니다.';
  }
  if (message.includes('user_not_found')) {
    return '사용자를 찾을 수 없습니다.';
  }
  if (message.includes('verification_not_found')) {
    return '인증 요청을 찾을 수 없습니다.';
  }
  if (message.includes('title_required')) {
    return '제목을 입력해 주세요.';
  }
  if (message.includes('required_fields_missing')) {
    return '필수 항목(기관명, 전화, 시도, 시군구)을 입력해 주세요.';
  }
  if (message.includes('email_required')) {
    return '이메일을 입력해 주세요.';
  }
  if (message.includes('email_mismatch')) {
    return '로그인한 계정 이메일과 동일한 주소만 승인할 수 있습니다.';
  }
  if (message.includes('not_authenticated')) {
    return '로그인이 필요합니다.';
  }
  if (
    message.includes('check_violation') ||
    message.includes('user_profiles_role_check') ||
    message.includes('23514')
  ) {
    return "DB에 'admin' 역할이 허용되지 않습니다. Supabase에서 migration_v5_admin_email_approval.sql을 실행해 주세요.";
  }
  if (
    message.includes('Could not find the function') ||
    message.includes('PGRST202') ||
    message.includes('schema cache')
  ) {
    const fnHint = fn ? ` (${fn})` : '';
    return `Supabase RPC 함수가 없습니다${fnHint}. migration_v5_admin_email_approval.sql을 SQL Editor에서 실행한 뒤 1분 후 다시 시도해 주세요.`;
  }
  if (message.includes('permission denied') || message.includes('42501')) {
    return 'RPC 실행 권한이 없습니다. migration_v5의 GRANT EXECUTE를 적용해 주세요.';
  }
  if (message.includes('email_not_configured')) {
    return (
      '이메일 API(RESEND_API_KEY)가 Edge Function에 없습니다.\n\n' +
      '설정 방법 (둘 중 하나):\n' +
      '• 대시보드: Project Settings → Edge Functions → Secrets → RESEND_API_KEY 추가\n' +
      '  https://supabase.com/dashboard/project/cdkyoeskhrwrpxgbmpqu/settings/functions\n' +
      '• CLI: npx supabase login 후\n' +
      '  npx supabase secrets set --project-ref cdkyoeskhrwrpxgbmpqu RESEND_API_KEY=re_여기에키\n\n' +
      'Resend API 키는 https://resend.com/api-keys 에서 발급합니다.\n' +
      '시크릿 저장 후 1~2분 뒤 이메일 전송을 다시 시도하세요. (재배포는 보통 불필요)'
    );
  }
  if (message.includes('server_misconfigured')) {
    return 'Edge Function 서버 설정이 불완전합니다. Supabase 대시보드에서 함수를 재배포하거나 지원팀에 문의해 주세요.';
  }
  if (message.includes('invalid_payload')) {
    return '이메일 전송 요청 데이터가 올바르지 않습니다. 수신 이메일과 초대 코드를 확인해 주세요.';
  }
  if (message.includes('resend_failed')) {
    return '이메일 발송에 실패했습니다. 발신 도메인(RESEND) 설정을 확인해 주세요.';
  }
  if (
    message.includes('Failed to send a request to the Edge Function') ||
    message.includes('Requested function was not found') ||
    message.includes('NOT_FOUND') ||
    message.includes('FunctionsFetchError') ||
    message.includes('FunctionsRelayError')
  ) {
    return (
      '초대 메일 Edge Function이 배포되지 않았거나 연결할 수 없습니다.\n\n' +
      '1) 터미널에서 프로젝트 루트(C:\\EMT_CONNECT)로 이동\n' +
      '2) npx supabase login\n' +
      '3) npx supabase link --project-ref cdkyoeskhrwrpxgbmpqu\n' +
      '4) Supabase 대시보드 Edge Functions Secrets에 RESEND_API_KEY 등록\n' +
      '5) npx supabase functions deploy send-invitation-email\n\n' +
      '또는 scripts\\deploy-send-invitation-email.ps1 실행'
    );
  }
  if (message.includes('not_authorized_admin')) {
    return '승인된 관리자만 초대 메일을 보낼 수 있습니다.';
  }
  return `${prefix}${message}`;
}

function formatSupabaseError(error: {
  message?: string | unknown;
  details?: string | unknown;
  hint?: string | unknown;
  code?: string | unknown;
}): string {
  const parts = [error.message, error.details, error.hint, error.code]
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object') return JSON.stringify(part);
      return part != null ? String(part) : '';
    })
    .filter(Boolean);
  return parts.join(' | ');
}

/** UI/로그용 — 절대 [object Object]가 나오지 않게 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof AdminServiceError) return error.message;
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of ['message', 'details', 'hint', 'code', 'error_description']) {
      const val = record[key];
      if (typeof val === 'string' && val.trim()) {
        parts.push(val);
      } else if (val && typeof val === 'object') {
        parts.push(formatErrorMessage(val));
      }
    }
    if (parts.length > 0) return parts.join(' | ');
    try {
      return JSON.stringify(error);
    } catch {
      return '알 수 없는 오류가 발생했습니다.';
    }
  }
  return String(error);
}

async function callRpc<T>(fn: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw new AdminServiceError(parseRpcError(formatSupabaseError(error), fn));
  if (data === null || data === undefined) {
    throw new AdminServiceError('서버가 빈 응답을 반환했습니다. Supabase 함수 배포 상태를 확인해 주세요.');
  }
  return data as T;
}

function isMissingRpcError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('could not find the function') ||
    normalized.includes('pgrst202') ||
    normalized.includes('schema cache')
  );
}

function toErrorMessage(error: unknown): string {
  return formatErrorMessage(error);
}

async function assertAuthenticatedSession() {
  const { data: initial, error: initialError } = await supabase.auth.getSession();
  if (initialError) {
    throw new AdminServiceError(formatSupabaseError(initialError));
  }

  let session = initial.session;

  if (!session?.access_token) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      throw new AdminServiceError(
        `로그인 세션 갱신 실패: ${formatSupabaseError(refreshError)}`,
      );
    }
    session = refreshed.session;
  }

  if (!session?.user?.id || !session.access_token) {
    throw new AdminServiceError(
      '로그인 세션이 없습니다. 화면을 새로고침한 뒤 로그아웃 → 다시 로그인해 주세요.',
    );
  }

  return session;
}

async function approveAdminDirect(userId: string, email: string): Promise<UserProfile> {
  const payload = {
    id: userId,
    email: email.trim(),
    role: 'admin' as const,
    is_approved: true,
    wallet_balance: 0,
  };

  const { data, error } = await supabase
    .from(USER_PROFILES_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw new AdminServiceError(formatSupabaseError(error));
  return data as UserProfile;
}

function isApprovedProfile(profile: UserProfile | null | undefined): profile is UserProfile {
  return Boolean(profile && profile.role === 'admin' && profile.is_approved);
}

/** 승인 요청 — RPC → 직접 DB 업데이트 순으로 시도 */
export async function requestAdminApproval(userId: string, email: string): Promise<UserProfile> {
  await assertAuthenticatedSession();
  const trimmedEmail = email.trim();
  const errors: string[] = [];

  const attempts: Array<() => Promise<UserProfile>> = [
    () => adminApproveUserByEmail(trimmedEmail),
    () => adminSelfApprove(),
    () => approveAdminDirect(userId, trimmedEmail),
  ];

  for (const attempt of attempts) {
    try {
      const profile = await attempt();
      if (isApprovedProfile(profile)) return profile;
      errors.push('승인 응답은 받았지만 admin/is_approved가 반영되지 않았습니다.');
    } catch (error) {
      errors.push(toErrorMessage(error));
    }
  }

  throw new AdminServiceError(
    errors.length > 0
      ? errors.join('\n')
      : '승인에 실패했습니다. Supabase에서 migration_v5_admin_email_approval.sql을 실행해 주세요.',
  );
}

/** 로그인 계정 자동 승인 (권장) */
export async function adminSelfApprove(): Promise<UserProfile> {
  return callRpc<UserProfile>('admin_self_approve', {});
}

export async function adminApproveUserByEmail(email: string): Promise<UserProfile> {
  try {
    return await callRpc<UserProfile>('admin_approve_user_by_email', {
      p_email: email.trim(),
    });
  } catch (error) {
    if (error instanceof AdminServiceError && isMissingRpcError(error.message)) {
      return adminSelfApprove();
    }
    throw error;
  }
}

export async function adminListUsers(
  search = '',
  limit = 50,
  offset = 0,
): Promise<AdminUserRow[]> {
  const data = await callRpc<AdminUserRow[]>('admin_list_users', {
    p_search: search || null,
    p_limit: limit,
    p_offset: offset,
  });
  return (data ?? []).map((row) => ({
    ...row,
    is_blocked: Boolean((row as AdminUserRow & { is_blocked?: boolean }).is_blocked),
  }));
}

export async function adminGetUserActivity(userId: string): Promise<AdminUserActivity> {
  const data = await callRpc<AdminUserActivity>('admin_get_user_activity', {
    p_user_id: userId,
  });
  return {
    questions: data?.questions ?? [],
    posts: data?.posts ?? [],
    answers: data?.answers ?? [],
  };
}

export async function adminSetUserBlocked(
  userId: string,
  blocked: boolean,
  reason?: string,
): Promise<AdminUserRow> {
  return callRpc<AdminUserRow>('admin_set_user_blocked', {
    p_user_id: userId,
    p_blocked: blocked,
    p_reason: reason ?? null,
  });
}

export async function adminListPendingVerifications(): Promise<AdminVerificationRow[]> {
  const data = await callRpc<AdminVerificationRow[]>('admin_list_pending_verifications', {});
  return data ?? [];
}

export async function adminReviewVerification(
  verificationId: string,
  status: 'approved' | 'rejected',
  notes?: string,
  targetRole: UserRole = 'paramedic',
): Promise<AdminVerificationRow> {
  return callRpc<AdminVerificationRow>('admin_review_verification', {
    p_verification_id: verificationId,
    p_status: status,
    p_notes: notes ?? null,
    p_target_role: targetRole,
  });
}

export async function adminCreateInvitationCode(
  targetRole: UserRole,
  expiresDays = 30,
  recipientEmail?: string,
): Promise<AdminInvitationCode> {
  return callRpc<AdminInvitationCode>('admin_create_invitation_code', {
    p_target_role: targetRole,
    p_expires_days: expiresDays,
    p_recipient_email: recipientEmail?.trim() || null,
  });
}

type InvitationEmailPayload = {
  to: string;
  code: string;
  targetRole: UserRole;
  expiresAt?: string | null;
};

type EdgeFunctionJsonError = {
  error?: string;
  message?: string;
  detail?: unknown;
};

async function resolveEdgeFunctionInvokeError(
  error: unknown,
  response?: Response,
): Promise<string> {
  const httpResponse =
    response ??
    (error &&
    typeof error === 'object' &&
    (error as { name?: string }).name === 'FunctionsHttpError' &&
    (error as { context?: unknown }).context instanceof Response
      ? (error as { context: Response }).context
      : undefined);

  if (httpResponse) {
    const status = httpResponse.status;
    if (status === 404) {
      return parseRpcError('Requested function was not found');
    }

    let payload: EdgeFunctionJsonError | null = null;
    try {
      payload = (await httpResponse.clone().json()) as EdgeFunctionJsonError;
    } catch {
      try {
        const text = (await httpResponse.clone().text()).trim();
        if (text) return parseRpcError(text);
      } catch {
        // ignore read errors
      }
    }

    if (payload) {
      const code = String(payload.error ?? payload.message ?? '').trim();
      const detail =
        typeof payload.detail === 'string'
          ? payload.detail
          : payload.detail != null
            ? JSON.stringify(payload.detail)
            : '';
      const combined = [code, detail].filter(Boolean).join(' | ');
      if (combined) return parseRpcError(combined);
    }

    if (status === 401) return parseRpcError('not_authenticated');
    if (status === 403) return parseRpcError('not_authorized_admin');
    if (status === 503) return parseRpcError('email_not_configured');
    if (status === 502) return parseRpcError('resend_failed');
    return parseRpcError(`edge_function_http_${status}`);
  }

  const relayContext =
    error &&
    typeof error === 'object' &&
    (error as { name?: string }).name === 'FunctionsRelayError' &&
    (error as { context?: unknown }).context instanceof Response
      ? (error as { context: Response }).context
      : undefined;

  if (relayContext) {
    return resolveEdgeFunctionInvokeError(null, relayContext);
  }

  const errMessage = formatErrorMessage(error);
  if (errMessage.includes('Edge Function returned a non-2xx status code')) {
    return 'Edge Function이 오류를 반환했습니다. Supabase Secrets(RESEND_API_KEY)와 관리자 승인 상태를 확인해 주세요.';
  }
  return parseRpcError(errMessage);
}

export async function adminSendInvitationEmail(
  payload: InvitationEmailPayload,
): Promise<{ success: boolean; id?: string | null }> {
  await assertAuthenticatedSession();

  const invokeBody = {
    to: payload.to.trim(),
    code: payload.code,
    targetRole: payload.targetRole,
    expiresAt: payload.expiresAt ?? null,
  };

  const { data: sessionWrap } = await supabase.auth.getSession();
  const accessToken = sessionWrap.session?.access_token;

  const invokeResult = (await supabase.functions.invoke('send-invitation-email', {
    body: invokeBody,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  })) as {
    data: { success?: boolean; id?: string; error?: string; detail?: unknown } | null;
    error: unknown;
    response?: Response;
  };

  const { data, error, response } = invokeResult;

  if (error) {
    const message = await resolveEdgeFunctionInvokeError(error, response);
    throw new AdminServiceError(message);
  }

  const result = data as { success?: boolean; id?: string; error?: string; detail?: unknown } | null;
  if (result?.error) {
    const detail =
      typeof result.detail === 'string'
        ? result.detail
        : result.detail
          ? JSON.stringify(result.detail)
          : '';
    throw new AdminServiceError(
      parseRpcError(`${result.error}${detail ? ` | ${detail}` : ''}`),
    );
  }

  return { success: Boolean(result?.success), id: result?.id ?? null };
}

export async function adminCreateInvitationCodeAndSendEmail(
  targetRole: UserRole,
  recipientEmail: string,
  expiresDays = 30,
): Promise<AdminInvitationCode> {
  const email = recipientEmail.trim();
  if (!email) {
    throw new AdminServiceError('수신 이메일을 입력해 주세요.');
  }

  const created = await adminCreateInvitationCode(targetRole, expiresDays, email);
  await adminSendInvitationEmail({
    to: email,
    code: created.code,
    targetRole: created.target_role,
    expiresAt: created.expires_at,
  });
  return created;
}

export async function adminListInvitationCodes(limit = 50): Promise<AdminInvitationCode[]> {
  const data = await callRpc<AdminInvitationCode[]>('admin_list_invitation_codes', {
    p_limit: limit,
  });
  return data ?? [];
}

export async function adminListJobPosts(): Promise<AdminJobPost[]> {
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new AdminServiceError(error.message);
  return (data ?? []) as AdminJobPost[];
}

export async function adminUpsertJobPost(input: {
  id?: string;
  postType: 'hire' | 'seek';
  title: string;
  company?: string;
  location?: string;
  salary?: string;
  schedule?: string;
  requirements?: string;
  content?: string;
  isUrgent?: boolean;
  isPublished?: boolean;
}): Promise<AdminJobPost> {
  return callRpc<AdminJobPost>('admin_upsert_job_post', {
    p_id: input.id ?? null,
    p_post_type: input.postType,
    p_title: input.title,
    p_company: input.company ?? null,
    p_location: input.location ?? null,
    p_salary: input.salary ?? null,
    p_schedule: input.schedule ?? null,
    p_requirements: input.requirements ?? null,
    p_content: input.content ?? null,
    p_is_urgent: input.isUrgent ?? false,
    p_is_published: input.isPublished ?? true,
  });
}

export async function adminDeleteJobPost(id: string): Promise<void> {
  await callRpc<boolean>('admin_delete_job_post', { p_id: id });
}

export async function adminListPrivateAmbulances(filters: {
  sido?: string;
  sigungu?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminPrivateAmbulance[]> {
  const data = await callRpc<AdminPrivateAmbulance[]>('admin_list_private_ambulances', {
    p_sido: filters.sido ?? null,
    p_sigungu: filters.sigungu ?? null,
    p_search: filters.search ?? null,
    p_limit: filters.limit ?? 100,
    p_offset: filters.offset ?? 0,
  });
  return data ?? [];
}

export async function adminUpsertPrivateAmbulance(input: {
  id?: string;
  externalId?: string;
  name: string;
  vehicleType?: string;
  vehicleCount?: number;
  region?: string;
  address?: string;
  phone: string;
  sido: string;
  sigungu: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<AdminPrivateAmbulance> {
  return callRpc<AdminPrivateAmbulance>('admin_upsert_private_ambulance', {
    p_id: input.id ?? null,
    p_external_id: input.externalId ?? null,
    p_name: input.name,
    p_vehicle_type: input.vehicleType ?? null,
    p_vehicle_count: input.vehicleCount ?? 1,
    p_region: input.region ?? null,
    p_address: input.address ?? null,
    p_phone: input.phone,
    p_sido: input.sido,
    p_sigungu: input.sigungu,
    p_latitude: input.latitude ?? null,
    p_longitude: input.longitude ?? null,
  });
}

export async function adminDeletePrivateAmbulance(id: string): Promise<void> {
  await callRpc<boolean>('admin_delete_private_ambulance', { p_id: id });
}

export async function adminListCustomHospitals(filters: {
  sido?: string;
  sigungu?: string;
  search?: string;
  includeHidden?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AdminCustomHospital[]> {
  const data = await callRpc<AdminCustomHospital[]>(
    'admin_list_custom_hospitals',
    {
      p_sido: filters.sido ?? null,
      p_sigungu: filters.sigungu ?? null,
      p_search: filters.search ?? null,
      p_include_hidden: filters.includeHidden ?? true,
      p_limit: filters.limit ?? 200,
      p_offset: filters.offset ?? 0,
    },
  );
  return data ?? [];
}

export async function adminUpsertCustomHospital(input: {
  id?: string;
  externalId?: string;
  hpid?: string;
  name: string;
  hospitalType: 'er' | 'moonlight' | 'pediatric' | 'general';
  sido: string;
  sigungu: string;
  address?: string;
  tel?: string;
  operatingHours?: unknown;
  departments?: string[];
  customMemo?: string;
  isHidden?: boolean;
  isPartner?: boolean;
  erCapable?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  hvctayn?: string | null;
  hvmriayn?: string | null;
  hvangioayn?: string | null;
  hvventiayn?: string | null;
  hvamyn?: string | null;
  hv120?: string | null;
  hv122?: string | null;
  hv2?: number | null;
  hv3?: number | null;
  hv4?: number | null;
  hv5?: number | null;
  hv6?: number | null;
  hv7?: number | null;
  hv8?: number | null;
  hv9?: number | null;
  hv10?: string | null;
  hv11?: string | null;
}): Promise<AdminCustomHospital> {
  return callRpc<AdminCustomHospital>('admin_upsert_custom_hospital', {
    p_id: input.id ?? null,
    p_external_id: input.externalId ?? null,
    p_hpid: input.hpid ?? null,
    p_name: input.name,
    p_hospital_type: input.hospitalType,
    p_sido: input.sido,
    p_sigungu: input.sigungu,
    p_address: input.address ?? null,
    p_tel: input.tel ?? '',
    p_operating_hours: input.operatingHours ?? [],
    p_departments: input.departments ?? [],
    p_custom_memo: input.customMemo ?? null,
    p_is_hidden: input.isHidden ?? false,
    p_is_partner: input.isPartner ?? false,
    p_er_capable: input.erCapable ?? input.hospitalType === 'er',
    p_latitude: input.latitude ?? null,
    p_longitude: input.longitude ?? null,
    p_hvctayn: input.hvctayn ?? null,
    p_hvmriayn: input.hvmriayn ?? null,
    p_hvangioayn: input.hvangioayn ?? null,
    p_hvventiayn: input.hvventiayn ?? null,
    p_hvamyn: input.hvamyn ?? null,
    p_hv120: input.hv120 ?? null,
    p_hv122: input.hv122 ?? null,
    p_hv2: input.hv2 ?? null,
    p_hv3: input.hv3 ?? null,
    p_hv4: input.hv4 ?? null,
    p_hv5: input.hv5 ?? null,
    p_hv6: input.hv6 ?? null,
    p_hv7: input.hv7 ?? null,
    p_hv8: input.hv8 ?? null,
    p_hv9: input.hv9 ?? null,
    p_hv10: input.hv10 ?? null,
    p_hv11: input.hv11 ?? null,
  });
}

export async function adminDeleteCustomHospital(id: string): Promise<void> {
  await callRpc<boolean>('admin_delete_custom_hospital', { p_id: id });
}

export async function adminListKemiPosts(filters?: {
  search?: string;
  includeUnpublished?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AdminKemiPost[]> {
  const data = await callRpc<AdminKemiPost[]>('admin_list_kemi_posts', {
    p_search: filters?.search ?? null,
    p_include_unpublished: filters?.includeUnpublished ?? true,
    p_limit: filters?.limit ?? 100,
    p_offset: filters?.offset ?? 0,
  });
  return data ?? [];
}

export async function adminUpsertKemiPost(input: {
  id?: string;
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}): Promise<AdminKemiPost> {
  return callRpc<AdminKemiPost>('admin_upsert_kemi_post', {
    p_id: input.id ?? null,
    p_title: input.title,
    p_slug: input.slug,
    p_content: input.content,
    p_thumbnail_url: input.thumbnailUrl ?? null,
    p_is_published: input.isPublished ?? false,
    p_seo_title: input.seoTitle ?? null,
    p_seo_description: input.seoDescription ?? null,
  });
}

export async function adminDeleteKemiPost(id: string): Promise<void> {
  await callRpc<boolean>('admin_delete_kemi_post', { p_id: id });
}
