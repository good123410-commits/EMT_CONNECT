import type { UserProfile } from '../types';
import { isAdminRole } from '../constants/roles';

export function canWriteCommunityAnswer(profile: UserProfile | null): boolean {
  if (!profile || profile.is_blocked) return false;
  if (isAdminRole(profile.role)) return true;
  if (!profile.is_approved) return false;
  return profile.role === 'associate_member' || profile.role === 'regular_member';
}
