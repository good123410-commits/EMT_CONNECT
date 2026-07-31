import {
  supabase,
  VERIFICATIONS_BUCKET,
  type EmtVerification,
} from '@/lib/supabaseClient';
import { subscribeUserProfileChanges } from '@/lib/realtimeSubscription';

export async function uploadVerificationDocument(
  userId: string,
  fileUri: string,
  mimeType = 'image/jpeg',
): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(VERIFICATIONS_BUCKET).upload(path, blob, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(VERIFICATIONS_BUCKET).getPublicUrl(path, {
    transform: { width: 300, quality: 75, resize: 'contain' },
  });
  return data.publicUrl;
}

function mapRpcError(error: { message?: string }): string {
  const message = error.message ?? '';
  if (message.includes('document_required')) {
    return '자격증 이미지가 필요합니다.';
  }
  if (message.includes('already_pending')) {
    return '이미 승인 대기 중입니다.';
  }
  if (message.includes('invalid_code')) {
    return '유효하지 않거나 만료된 비밀코드입니다.';
  }
  if (message.includes('code_required')) {
    return '비밀코드를 입력해 주세요.';
  }
  return message || '요청 처리에 실패했습니다.';
}

/** Step 1 — 자격증 이미지만 제출 */
export async function submitEmsDocumentRequest(documentUrl: string): Promise<EmtVerification> {
  const { data, error } = await supabase.rpc('submit_ems_verification_document', {
    p_document_url: documentUrl,
  });

  if (error) {
    throw new Error(mapRpcError(error));
  }

  return data as EmtVerification;
}

/** Step 3 — 비밀코드 입력 완료 */
export async function submitVerificationCode(invitationCode: string): Promise<EmtVerification> {
  const normalizedCode = invitationCode.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error('비밀코드를 입력해 주세요.');
  }

  const { data, error } = await supabase.rpc('submit_paramedic_code_request', {
    p_code: normalizedCode,
    p_document_url: null,
  });

  if (error) {
    throw new Error(mapRpcError(error));
  }

  return data as EmtVerification;
}

export async function fetchLatestVerification(userId: string): Promise<EmtVerification | null> {
  const { data, error } = await supabase
    .from('emt_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as EmtVerification | null;
}

export function subscribeProfileChanges(userId: string, onChange: () => void): () => void {
  return subscribeUserProfileChanges(userId, onChange);
}
