import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { useUserRole } from '@/contexts/UserRoleContext';

/** 커뮤니티 비밀글 열람 등 관리자 권한 */
export function useCommunityModerator(): boolean {
  const { isDbAdmin } = useLiveDbAdmin();
  const { opsAdminVerified } = useUserRole();
  return isDbAdmin || opsAdminVerified;
}
