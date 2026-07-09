import {
  supabase,
  VERIFICATIONS_BUCKET,
  type EmtVerification,
} from '@/lib/supabaseClient';

const VALID_INVITATION_CODES = ['EMS-TEST-PRO', 'EMT-INVITE-2026'];

export function isValidInvitationCode(code: string): boolean {
  return VALID_INVITATION_CODES.includes(code.trim().toUpperCase());
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

  const { data } = supabase.storage.from(VERIFICATIONS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function submitVerificationRequest(
  userId: string,
  invitationCode: string,
  documentUrl: string,
): Promise<EmtVerification> {
  const normalizedCode = invitationCode.trim().toUpperCase();

  const { data, error } = await supabase
    .from('emt_verifications')
    .insert({
      user_id: userId,
      document_url: documentUrl,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw error;

  await supabase
    .from('profiles')
    .update({ invitation_code_used: normalizedCode })
    .eq('id', userId);

  if (isValidInvitationCode(normalizedCode)) {
    await supabase
      .from('profiles')
      .update({ role: 'emt_certified', is_approved: true })
      .eq('id', userId);

    await supabase
      .from('emt_verifications')
      .update({ status: 'approved', reviewer_notes: 'Auto-approved (test invitation code)' })
      .eq('id', data.id);
  }

  const { data: updated, error: fetchError } = await supabase
    .from('emt_verifications')
    .select('*')
    .eq('id', data.id)
    .single();

  if (fetchError) throw fetchError;
  return updated as EmtVerification;
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
