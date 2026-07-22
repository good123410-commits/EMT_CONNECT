import type { HiddenPostTargetRole, UserRole } from '@/lib/supabaseClient';

export const EXPERT_ROLES: UserRole[] = ['hospital', 'paramedic', 'private_ems'];

export function isExpertRole(role: UserRole): boolean {
  return EXPERT_ROLES.includes(role);
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin';
}

/** DB admin 역할 또는 비밀코드 인증 시 가이드 관리 가능 */
export function canManageEmergencyGuides(role: UserRole, guideAdminVerified: boolean): boolean {
  return isAdminRole(role) || guideAdminVerified;
}

/** 전문가 역할 + 관리자 승인 완료 시에만 히든 채널 접근 가능 */
export function canAccessHiddenChannel(role: UserRole, isApproved: boolean): boolean {
  return isExpertRole(role) && isApproved;
}

/** 구급대원(응급구조사) 채널 — role=paramedic + 관리자 승인 */
export function isApprovedParamedic(role: UserRole, isApproved: boolean): boolean {
  return role === 'paramedic' && isApproved;
}

/** 구급대원(응급구조사) 채널 — paramedic+승인, DB admin+승인, 운영 관리자 코드 */
export function canAccessParamedicChannel(
  role: UserRole,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  if (opsAdminVerified) return true;
  if (isApproved && role === 'admin') return true;
  return isApprovedParamedic(role, isApproved);
}

/** 역할별 조회/작성 가능한 target_role 목록 */
export function getAllowedTargetRoles(role: UserRole): HiddenPostTargetRole[] {
  switch (role) {
    case 'paramedic':
      return ['all', 'paramedic'];
    case 'hospital':
      return ['all', 'hospital'];
    case 'private_ems':
      return ['all', 'private_ems'];
    default:
      return [];
  }
}

export function canWriteToTargetRole(role: UserRole, targetRole: HiddenPostTargetRole): boolean {
  return getAllowedTargetRoles(role).includes(targetRole);
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'user':
      return '일반인';
    case 'hospital':
      return '병원 관계자';
    case 'paramedic':
      return '응급구조사';
    case 'private_ems':
      return '사설 구급차 운용자';
    case 'admin':
      return '관리자';
    default:
      return role;
  }
}

export function getTargetRoleLabel(targetRole: HiddenPostTargetRole): string {
  switch (targetRole) {
    case 'all':
      return '공통 라운지';
    case 'hospital':
      return '병원 채널';
    case 'paramedic':
      return '응급구조사 소모임';
    case 'private_ems':
      return '사설 구급차 채널';
    case 'nurse':
      return '간호사 채널';
    default:
      return targetRole;
  }
}

export type AppRouteKind =
  | 'public'
  | 'hospital'
  | 'paramedic'
  | 'private_ems'
  | 'pending_approval';

/** 로그인 후 카멜레온 라우팅 결정 */
export function resolveAppRoute(role: UserRole, isApproved: boolean): AppRouteKind {
  if (role === 'user' || role === 'admin') return 'public';
  if (!isApproved) return 'pending_approval';
  return role;
}
