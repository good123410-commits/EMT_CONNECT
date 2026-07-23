import type { UserProfile, UserRole } from '@/lib/supabaseClient';

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'sub_admin';
}

/** 구급대원 히든공간·Q&A 답변 — 준회원 이상 */
export function canAccessParamedicSpace(
  role: UserRole | null | undefined,
  isApproved: boolean,
  opsAdminVerified = false,
): boolean {
  if (opsAdminVerified) return true;
  if (!role || !isApproved) return false;
  if (isAdminRole(role)) return true;
  return role === 'associate_member' || role === 'regular_member' || role === 'paramedic';
}

/** 투표 — 정회원 이상 */
export function canVoteInPolls(
  role: UserRole | null | undefined,
  isApproved: boolean,
): boolean {
  if (!role || !isApproved) return false;
  return role === 'regular_member' || isAdminRole(role);
}

export const POLL_VOTE_GATE_MESSAGE =
  '투표 권한은 월 회비를 납부한 정회원 전용 기능입니다.';

export const PARAMEDIC_SPACE_GATE_MESSAGE =
  '구급대원 히든공간은 구급대원 인증을 완료한 준회원 이상만 이용할 수 있습니다.';

export function isAssociateParamedic(role: UserRole, isApproved: boolean): boolean {
  return (
    isApproved &&
    (role === 'associate_member' || role === 'regular_member' || role === 'paramedic')
  );
}

export function isRegularMember(role: UserRole, isApproved: boolean): boolean {
  return isApproved && (role === 'regular_member' || isAdminRole(role));
}

export function mapProfileRole(profile: UserProfile | null | undefined): {
  role: UserRole;
  isApproved: boolean;
} {
  return {
    role: profile?.role ?? 'user',
    isApproved: profile?.is_approved ?? false,
  };
}
