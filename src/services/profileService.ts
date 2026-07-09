import { supabase, type Profile } from '@/lib/supabaseClient';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function ensureProfile(userId: string, name?: string): Promise<Profile> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: name ?? null,
      role: 'public',
      is_approved: false,
      wallet_balance: 0,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateProfileRole(
  userId: string,
  role: Profile['role'],
  invitationCode?: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      role,
      is_approved: role === 'emt_certified',
      invitation_code_used: invitationCode ?? null,
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}
