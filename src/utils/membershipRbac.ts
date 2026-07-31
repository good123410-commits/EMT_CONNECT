import type { UserProfile, UserRole } from '@/lib/supabaseClient';

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

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return normalizeUserRole(role) === 'admin';
}

/** 구급대원 히든공간·Q&A 답변 — 준회원 이상 */
export function canAccessParamedicSpace(
  role: UserRole | null | undefined,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  if (opsAdminVerified) return true;
  const normalized = normalizeUserRole(role);
  if (!isApproved) return false;
  if (isAdminRole(normalized)) return true;
  return normalized === 'associate_member' || normalized === 'regular_member';
}

/** 투표 — 정회원·관리자 */
export function canVoteInPolls(
  role: UserRole | null | undefined,
  isApproved: boolean,
): boolean {
  const normalized = normalizeUserRole(role);
  if (!isApproved) return false;
  return normalized === 'regular_member' || isAdminRole(normalized);
}

export const POLL_VOTE_GATE_MESSAGE =
  '투표 권한은 월 회비를 납부한 정회원 전용 기능입니다.';

export const PARAMEDIC_SPACE_GATE_MESSAGE =
  '구급대원 히든공간은 구급대원 인증을 완료한 준회원 이상만 이용할 수 있습니다.';

export function isAssociateParamedic(role: UserRole, isApproved: boolean): boolean {
  const normalized = normalizeUserRole(role);
  return (
    isApproved && (normalized === 'associate_member' || normalized === 'regular_member')
  );
}

export function isRegularMember(role: UserRole, isApproved: boolean): boolean {
  const normalized = normalizeUserRole(role);
  return isApproved && (normalized === 'regular_member' || isAdminRole(normalized));
}

export function mapProfileRole(profile: UserProfile | null | undefined): {
  role: UserRole;
  isApproved: boolean;
} {
  return {
    role: normalizeUserRole(profile?.role),
    isApproved: profile?.is_approved ?? false,
  };
}
