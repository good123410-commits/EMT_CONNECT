import type { UserRole } from '@/lib/supabaseClient';
import { canAccessParamedicSpace, isAdminRole } from '@/utils/membershipRbac';

export function canWriteCommunityAnswer(
  role: UserRole | null | undefined,
  isApproved: boolean,
): boolean {
  return canAccessParamedicSpace(role, isApproved);
}

export { isAdminRole };
