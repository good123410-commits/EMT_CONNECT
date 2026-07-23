import type { UserRole } from '../types';

export const MEMBER_ROLES = [
  'super_admin',
  'sub_admin',
  'regular_member',
  'associate_member',
  'user',
] as const;

export const MEMBERSHIP_ROLES: UserRole[] = ['regular_member', 'associate_member', 'user'];

export const ADMIN_ROLE_OPTIONS: UserRole[] = ['super_admin', 'sub_admin', 'admin'];

export const LEGACY_ROLE_OPTIONS: UserRole[] = ['hospital', 'paramedic', 'private_ems'];

export const ALL_USER_ROLES: UserRole[] = [
  'super_admin',
  'sub_admin',
  'regular_member',
  'associate_member',
  'user',
  'admin',
  'hospital',
  'paramedic',
  'private_ems',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '최고관리자',
  sub_admin: '준관리자',
  regular_member: '정회원',
  associate_member: '준회원',
  user: '일반회원',
  admin: '관리자(레거시)',
  hospital: '병원',
  paramedic: '구급대원',
  private_ems: '민간구급',
};

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'sub_admin', 'admin'];

export function getRoleLabel(role: UserRole | string | null | undefined): string {
  if (!role) return '일반회원';
  return ROLE_LABELS[role as UserRole] ?? String(role);
}

export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return role === 'super_admin' || role === 'sub_admin' || role === 'admin';
}
