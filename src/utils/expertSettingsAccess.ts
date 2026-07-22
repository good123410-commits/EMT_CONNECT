import type { UserRole } from '@/lib/supabaseClient';

/** DB 승인 관리자 — 통합 대시보드 전용 */
export function isApprovedDbAdmin(role: UserRole, isApproved: boolean): boolean {
  return role === 'admin' && isApproved;
}

/** 설정 히든 메뉴 — 승인된 구급대원·관리자 */
export function canAccessExpertAnswerInbox(
  role: UserRole,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  return (
    opsAdminVerified || (isApproved && (role === 'paramedic' || role === 'admin'))
  );
}

/** Q&A 운영 대시보드 — 구급대원·관리자·운영코드 */
export function canAccessAdminDashboard(
  role: UserRole,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  return (
    opsAdminVerified || (isApproved && (role === 'paramedic' || role === 'admin'))
  );
}

/** 운영 비밀코드 포털 — Q&A·답변함·구급대원 공간 */
export function canAccessOpsAdminPortal(
  role: UserRole,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  return canAccessAdminDashboard(role, isApproved, opsAdminVerified);
}

/** 통합 관리자 대시보드 — DB admin 또는 운영 비밀코드 */
export function canAccessIntegratedAdminDashboard(
  role: UserRole,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  return isApprovedDbAdmin(role, isApproved) || opsAdminVerified;
}
