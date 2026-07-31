import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import {
  canAccessAdminDashboard,
  canAccessIntegratedAdminDashboard,
  canAccessOpsAdminPortal,
  isApprovedDbAdmin,
} from '@/utils/expertSettingsAccess';

/** user_profiles.role / is_approved + 운영 관리자 코드 세션 */
export function useExpertSettingsAccess() {
  const { profile } = useAuth();
  const { opsAdminVerified } = useUserRole();

  const role = profile?.role ?? 'user';
  const isApproved = profile?.is_approved ?? false;

  return useMemo(
    () => ({
      role,
      isApproved,
      opsAdminVerified,
      canOpenAdminDashboard: canAccessIntegratedAdminDashboard(role, isApproved, opsAdminVerified),
      canOpenOpsAdminPortal: canAccessOpsAdminPortal(role, isApproved, opsAdminVerified),
      canOpenQaDashboard: canAccessAdminDashboard(role, isApproved, opsAdminVerified),
      isDbAdmin: isApprovedDbAdmin(role, isApproved),
    }),
    [role, isApproved, opsAdminVerified],
  );
}
