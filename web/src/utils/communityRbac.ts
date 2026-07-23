import type { UserProfile } from '../types';

export function canWriteCommunityAnswer(profile: UserProfile | null): boolean {
  if (!profile || profile.is_blocked) return false;
  if (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'sub_admin') {
    return true;
  }
  if (!profile.is_approved) return false;
  return (
    profile.role === 'associate_member' ||
    profile.role === 'regular_member' ||
    profile.role === 'paramedic'
  );
}