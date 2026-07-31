import type { UserProfile } from '../types';
import { isAdminRole, normalizeUserRole } from '../constants/roles';

/** 구급대원 히든공간·Q&A 답변 — 준회원 이상 */
export function canAccessParamedicSpace(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.is_blocked) return false;
  const role = normalizeUserRole(profile.role);
  if (isAdminRole(role)) return true;
  if (!profile.is_approved) return false;
  return role === 'associate_member' || role === 'regular_member';
}

/** 투표 — 정회원·관리자 */
export function canVoteInPolls(profile: UserProfile | null | undefined): boolean {
  if (!profile || profile.is_blocked || !profile.is_approved) return false;
  const role = normalizeUserRole(profile.role);
  return role === 'regular_member' || isAdminRole(role);
}

export const POLL_VOTE_GATE_MESSAGE =
  '투표 권한은 월 회비를 납부한 정회원 전용 기능입니다.';

export const PARAMEDIC_SPACE_GATE_MESSAGE =
  '구급대원 히든공간은 구급대원 인증을 완료한 준회원 이상만 이용할 수 있습니다.';
