import {
  supabase,
  USER_PROFILES_TABLE,
  VERIFICATIONS_BUCKET,
  type EmtVerification,
} from '@/lib/supabaseClient';

const VALID_INVITATION_CODES: Record<string, string> = {
  'EMS-TEST-PRO': 'associate_member',
  'EMT-INVITE-2026': 'associate_member',
};

export function isValidInvitationCode(code: string): boolean {
  return code.trim().toUpperCase() in VALID_INVITATION_CODES;
}

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

export async function submitVerificationRequest(
  userId: string,
  invitationCode: string,
  documentUrl?: string | null,
): Promise<EmtVerification> {
  const normalizedCode = invitationCode.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error('구급대원 비밀코드를 입력해 주세요.');
  }

  const { data, error } = await supabase.rpc('submit_paramedic_code_request', {
    p_code: normalizedCode,
    p_document_url: documentUrl ?? null,
  });

  if (error) {
    if (error.message.includes('invalid_code')) {
      throw new Error('유효하지 않거나 만료된 비밀코드입니다.');
    }
    throw error;
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
  const channel = supabase
    .channel(`user_profile_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: USER_PROFILES_TABLE,
        filter: `id=eq.${userId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
