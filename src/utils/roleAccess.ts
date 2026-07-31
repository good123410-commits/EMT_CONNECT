import type { UserRole } from '@/lib/supabaseClient';
import {
  canAccessParamedicSpace,
  canVoteInPolls,
  isAdminRole,
  isAssociateParamedic,
  isRegularMember,
  normalizeUserRole,
  PARAMEDIC_SPACE_GATE_MESSAGE,
  POLL_VOTE_GATE_MESSAGE,
} from '@/utils/membershipRbac';

export const EXPERT_ROLES: UserRole[] = ['associate_member', 'regular_member'];

export function isExpertRole(role: UserRole): boolean {
  const normalized = normalizeUserRole(role);
  return EXPERT_ROLES.includes(normalized);
}

export {
  isAdminRole,
  canVoteInPolls,
  isAssociateParamedic,
  isRegularMember,
  normalizeUserRole,
  PARAMEDIC_SPACE_GATE_MESSAGE,
  POLL_VOTE_GATE_MESSAGE,
};

/** DB admin 역할 또는 비밀코드 인증 시 가이드 관리 가능 */
export function canManageEmergencyGuides(role: UserRole, guideAdminVerified: boolean): boolean {
  return isAdminRole(role) || guideAdminVerified;
}

/** 전문가 역할 + 관리자 승인 완료 시에만 히든 채널 접근 가능 */
export function canAccessHiddenChannel(role: UserRole, isApproved: boolean): boolean {
  return canAccessParamedicSpace(role, isApproved);
}

/** @deprecated membershipRbac.isAssociateParamedic 사용 */
export function isApprovedParamedic(role: UserRole, isApproved: boolean): boolean {
  return isAssociateParamedic(role, isApproved);
}

/** 구급대원 채널 — 준회원 이상 + 운영 관리자 코드 */
export function canAccessParamedicChannel(
  role: UserRole,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  return canAccessParamedicSpace(role, isApproved, opsAdminVerified);
}

/** 역할별 조회/작성 가능한 target_role 목록 */
export function getAllowedTargetRoles(
  role: UserRole,
): import('@/lib/supabaseClient').HiddenPostTargetRole[] {
  const normalized = normalizeUserRole(role);
  if (isAdminRole(normalized)) {
    return ['all', 'paramedic'];
  }
  if (normalized === 'associate_member' || normalized === 'regular_member') {
    return ['all', 'paramedic'];
  }
  return [];
}

export function canWriteToTargetRole(
  role: UserRole,
  targetRole: import('@/lib/supabaseClient').HiddenPostTargetRole,
): boolean {
  return getAllowedTargetRoles(role).includes(targetRole);
}

export function getRoleLabel(role: UserRole): string {
  switch (normalizeUserRole(role)) {
    case 'user':
      return '일반회원';
    case 'associate_member':
      return '준회원';
    case 'regular_member':
      return '정회원';
    case 'admin':
      return '관리자';
    default:
      return '일반회원';
  }
}

export function getTargetRoleLabel(
  targetRole: import('@/lib/supabaseClient').HiddenPostTargetRole,
): string {
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

export type AppRouteKind = 'public' | 'paramedic' | 'pending_approval';

/** 로그인 후 카멜레온 라우팅 결정 */
export function resolveAppRoute(role: UserRole, isApproved: boolean): AppRouteKind {
  const normalized = normalizeUserRole(role);
  if (normalized === 'user' || isAdminRole(normalized)) return 'public';
  if (normalized === 'associate_member' || normalized === 'regular_member') {
    return isApproved ? 'paramedic' : 'pending_approval';
  }
  return 'public';
}
