import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { canAccessIntegratedAdminDashboard } from '@/utils/expertSettingsAccess';

/** 관리자 숏코드 트리거 `[@ㅅ@]` 사용 가능 여부 */
export function useCanUseAdminShortcodes(): boolean {
  const { isDbAdmin } = useLiveDbAdmin();
  const { opsAdminVerified } = useUserRole();
  const { profile } = useAuth();

  if (isDbAdmin || opsAdminVerified) {
    return true;
  }

  if (!profile) {
    return false;
  }

  return canAccessIntegratedAdminDashboard(profile.role, profile.is_approved, opsAdminVerified);
}
