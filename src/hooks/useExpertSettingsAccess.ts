import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import {
  canAccessAdminDashboard,
  canAccessExpertAnswerInbox,
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
      canOpenAnswerInbox: canAccessExpertAnswerInbox(role, isApproved, opsAdminVerified),
      canOpenAdminDashboard: canAccessIntegratedAdminDashboard(role, isApproved, opsAdminVerified),
      canOpenOpsAdminPortal: canAccessOpsAdminPortal(role, isApproved, opsAdminVerified),
      canOpenQaDashboard: canAccessAdminDashboard(role, isApproved, opsAdminVerified),
      isDbAdmin: isApprovedDbAdmin(role, isApproved),
      showExpertSettingsMenu:
        canAccessExpertAnswerInbox(role, isApproved, opsAdminVerified) ||
        canAccessIntegratedAdminDashboard(role, isApproved, opsAdminVerified) ||
        canAccessOpsAdminPortal(role, isApproved, opsAdminVerified),
    }),
    [role, isApproved, opsAdminVerified],
  );
}
