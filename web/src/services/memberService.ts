import { supabase } from '../lib/supabase';
import type { PublicMember } from '../types';

export async function fetchPublicMembers(): Promise<PublicMember[]> {
  const { data, error } = await supabase.rpc('list_public_members');
  if (error) throw error;
  return (data ?? []) as PublicMember[];
}

export function subscribePublicMembers(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_public_members_web')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () =>
      onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
