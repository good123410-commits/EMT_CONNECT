import {
  HIDDEN_POSTS_TABLE,
  supabase,
  type HiddenPost,
  type HiddenPostTargetRole,
  type UserRole,
} from '@/lib/supabaseClient';
import {
  canAccessHiddenChannel,
  canWriteToTargetRole,
  getAllowedTargetRoles,
} from '@/utils/roleAccess';

export class HiddenPostAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HiddenPostAccessError';
  }
}

function assertChannelAccess(role: UserRole, isApproved: boolean): void {
  if (!canAccessHiddenChannel(role, isApproved)) {
    throw new HiddenPostAccessError('히든 채널 접근 권한이 없습니다. 관리자 승인을 확인해 주세요.');
  }
}

/** 역할에 맞는 게시글만 서버에서 필터링 조회 */
export async function fetchHiddenPosts(
  role: UserRole,
  isApproved: boolean,
): Promise<HiddenPost[]> {
  assertChannelAccess(role, isApproved);

  const allowedTargets = getAllowedTargetRoles(role);
  const { data, error } = await supabase
    .from(HIDDEN_POSTS_TABLE)
    .select('*, author:user_profiles(name, company_name, role)')
    .in('target_role', allowedTargets)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as HiddenPost[];
}

export async function createHiddenPost(
  authorId: string,
  role: UserRole,
  isApproved: boolean,
  targetRole: HiddenPostTargetRole,
  title: string,
  content: string,
): Promise<HiddenPost> {
  assertChannelAccess(role, isApproved);

  if (!canWriteToTargetRole(role, targetRole)) {
    throw new HiddenPostAccessError(
      `현재 역할(${role})에서는 '${targetRole}' 채널에 글을 작성할 수 없습니다.`,
    );
  }

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) {
    throw new HiddenPostAccessError('제목과 내용을 모두 입력해 주세요.');
  }

  const { data, error } = await supabase
    .from(HIDDEN_POSTS_TABLE)
    .insert({
      author_id: authorId,
      target_role: targetRole,
      title: trimmedTitle,
      content: trimmedContent,
    })
    .select('*, author:user_profiles(name, company_name, role)')
    .single();

  if (error) throw error;
  return data as HiddenPost;
}
