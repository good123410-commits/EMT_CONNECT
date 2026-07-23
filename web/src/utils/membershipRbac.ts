import type { UserProfile } from '../types';

/** 구급대원 히든공간·Q&A 답변 — 준회원 이상 */
export function canAccessParamedicSpace(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.is_blocked) return false;
  if (profile.role === 'super_admin' || profile.role === 'sub_admin' || profile.role === 'admin') {
    return true;
  }
  if (!profile.is_approved) return false;
  return (
    profile.role === 'associate_member' ||
    profile.role === 'regular_member' ||
    profile.role === 'paramedic'
  );
}

/** 투표 — 정회원 이상 */
export function canVoteInPolls(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.is_blocked || !profile.is_approved) return false;
  return (
    profile.role === 'regular_member' ||
    profile.role === 'super_admin' ||
    profile.role === 'sub_admin' ||
    profile.role === 'admin'
  );
}

export const POLL_VOTE_GATE_MESSAGE =
  '투표 권한은 월 회비를 납부한 정회원 전용 기능입니다.';

export const PARAMEDIC_SPACE_GATE_MESSAGE =
  '구급대원 히든공간은 구급대원 인증을 완료한 준회원 이상만 이용할 수 있습니다.';
