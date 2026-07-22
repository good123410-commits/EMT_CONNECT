import {
  supabase,
  USER_PROFILES_TABLE,
  type UserProfile,
  type UserRole,
} from '@/lib/supabaseClient';

const LEGACY_PROFILES_TABLE = 'profiles';

function mapLegacyRole(role: string | null | undefined): UserRole {
  if (role === 'emt_certified') return 'paramedic';
  if (role === 'public') return 'user';
  if (role === 'hospital' || role === 'paramedic' || role === 'private_ems' || role === 'admin') return role;
  return 'user';
}

function mapLegacyProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id ?? ''),
    email: typeof row.email === 'string' ? row.email : null,
    role: mapLegacyRole(typeof row.role === 'string' ? row.role : null),
    name: typeof row.name === 'string' ? row.name : null,
    company_name: typeof row.company_name === 'string' ? row.company_name : null,
    invitation_code:
      typeof row.invitation_code === 'string'
        ? row.invitation_code
        : typeof row.invitation_code_used === 'string'
          ? row.invitation_code_used
          : null,
    is_approved: Boolean(row.is_approved),
    wallet_balance: Number(row.wallet_balance) || 0,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

async function fetchFromTable(table: string, userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from(table).select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return table === USER_PROFILES_TABLE
    ? (data as UserProfile)
    : mapLegacyProfile(data as Record<string, unknown>);
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    return await fetchFromTable(USER_PROFILES_TABLE, userId);
  } catch {
    try {
      return await fetchFromTable(LEGACY_PROFILES_TABLE, userId);
    } catch {
      return null;
    }
  }
}

async function fetchUserProfileRow(userId: string): Promise<UserProfile | null> {
  try {
    return await fetchFromTable(USER_PROFILES_TABLE, userId);
  } catch {
    return null;
  }
}

function isMissingUserProfilesColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('schema cache') || lower.includes('could not find the');
}

/** PostgREST 스키마에 없는 컬럼은 제거하고 upsert 재시도 (v5 DB: name/wallet 등 없음) */
async function upsertUserProfileRow(payload: Record<string, unknown>): Promise<UserProfile> {
  let current: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase
      .from(USER_PROFILES_TABLE)
      .upsert(current, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error && data) {
      return data as UserProfile;
    }

    if (!error) {
      break;
    }

    if (!isMissingUserProfilesColumnError(error.message)) {
      throw new Error(`회원 프로필(user_profiles)을 준비하지 못했습니다: ${error.message}`);
    }

    const match = error.message.match(/Could not find the '([^']+)' column/);
    const missingKey = match?.[1];
    if (!missingKey || !(missingKey in current)) {
      throw new Error(`회원 프로필(user_profiles)을 준비하지 못했습니다: ${error.message}`);
    }

    const next = { ...current };
    delete next[missingKey];
    current = next;

    if (!('id' in current)) {
      throw new Error('회원 프로필(user_profiles)을 준비하지 못했습니다: id가 필요합니다.');
    }
  }

  throw new Error(
    '회원 프로필(user_profiles)을 준비하지 못했습니다. Supabase에서 migration_v11_user_profiles_columns.sql을 실행해 주세요.',
  );
}

/** 로그인 사용자 user_profiles 행 보장 (Supabase RPC, 없으면 클라이언트 upsert) */
export async function ensureProfile(
  userId: string,
  name?: string,
  email?: string,
): Promise<UserProfile> {
  const { error: rpcError } = await supabase.rpc('ensure_my_user_profile');
  if (!rpcError) {
    const row = await fetchUserProfileRow(userId);
    if (row) return row;
  }

  const onUserProfiles = await fetchUserProfileRow(userId);
  if (onUserProfiles) return onUserProfiles;

  const legacy = await fetchProfile(userId);
  const payload = legacy
    ? {
        id: userId,
        email: email ?? legacy.email ?? null,
        name: legacy.name ?? name ?? null,
        role: legacy.role,
        is_approved: legacy.is_approved,
        wallet_balance: legacy.wallet_balance ?? 0,
      }
    : {
        id: userId,
        email: email ?? null,
        name: name ?? null,
        role: 'user' as const,
        is_approved: false,
        wallet_balance: 0,
      };

  return upsertUserProfileRow(payload);
}

export async function updateProfileRole(
  userId: string,
  role: UserRole,
  invitationCode?: string,
  isApproved = false,
): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from(USER_PROFILES_TABLE)
      .update({
        role,
        is_approved: isApproved,
        invitation_code: invitationCode ?? null,
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch {
    const legacyRole = role === 'user' ? 'public' : role === 'paramedic' ? 'emt_certified' : role;
    const { data, error } = await supabase
      .from(LEGACY_PROFILES_TABLE)
      .update({
        role: legacyRole,
        is_approved: isApproved,
        invitation_code_used: invitationCode ?? null,
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return mapLegacyProfile(data as Record<string, unknown>);
  }
}
