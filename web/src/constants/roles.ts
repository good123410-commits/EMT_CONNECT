import type { UserRole } from '../types';

/** 회원 등급 4단계 */
export const USER_ROLES: UserRole[] = ['admin', 'regular_member', 'associate_member', 'user'];

export const MEMBERSHIP_ROLES: UserRole[] = ['user', 'associate_member', 'regular_member'];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '관리자',
  regular_member: '정회원',
  associate_member: '준회원',
  user: '일반회원',
};

export function normalizeUserRole(role: string | null | undefined): UserRole {
  if (!role) return 'user';
  switch (role) {
    case 'admin':
    case 'super_admin':
    case 'sub_admin':
      return 'admin';
    case 'regular_member':
      return 'regular_member';
    case 'associate_member':
    case 'paramedic':
    case 'hospital':
    case 'private_ems':
      return 'associate_member';
    case 'user':
      return 'user';
    default:
      return 'user';
  }
}

export function getRoleLabel(role: UserRole | string | null | undefined): string {
  const normalized = normalizeUserRole(role);
  return ROLE_LABELS[normalized];
}

export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return normalizeUserRole(role) === 'admin';
}
