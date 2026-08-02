import { supabase } from '../lib/supabase';
import type { GuideComment, GuideEngagement } from '../types/guideSocial';

const EMPTY_ENGAGEMENT: GuideEngagement = {
  like_count: 0,
  comment_count: 0,
  liked: false,
};

function isMissingRpcError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('could not find the function') ||
    (lower.includes('function') && lower.includes('does not exist')) ||
    lower.includes('schema cache')
  );
}

function mapEngagement(row: Record<string, unknown>): GuideEngagement {
  return {
    like_count: Number(row.like_count) || 0,
    comment_count: Number(row.comment_count) || 0,
    liked: Boolean(row.liked),
  };
}

function mapComment(row: Record<string, unknown>): GuideComment {
  return {
    id: String(row.id ?? ''),
    post_id: String(row.post_id ?? ''),
    author_id: String(row.author_id ?? ''),
    author_label: String(row.author_label ?? '회원'),
    content: String(row.content ?? ''),
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

async function fetchEngagementFallback(postId: string): Promise<GuideEngagement> {
  const { data: post, error: postError } = await supabase
    .from('kemi_posts')
    .select('like_count, comment_count')
    .eq('id', postId)
    .eq('is_published', true)
    .maybeSingle();

  if (postError) throw postError;
  if (!post) return EMPTY_ENGAGEMENT;

  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  let liked = false;

  if (userId) {
    const { data: likeRow } = await supabase
      .from('kemi_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();
    liked = Boolean(likeRow);
  }

  return {
    like_count: Number(post.like_count) || 0,
    comment_count: Number(post.comment_count) || 0,
    liked,
  };
}

async function fetchCommentsFallback(postId: string): Promise<GuideComment[]> {
  const { data, error } = await supabase
    .from('kemi_post_comments')
    .select('id, post_id, author_id, author_label, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapComment(row as Record<string, unknown>));
}

export async function fetchGuideEngagement(postId: string): Promise<GuideEngagement> {
  const { data, error } = await supabase.rpc('get_kemi_post_engagement', {
    p_post_id: postId,
  });

  if (error) {
    if (error.message.includes('post_not_found')) return EMPTY_ENGAGEMENT;
    if (isMissingRpcError(error.message)) return fetchEngagementFallback(postId);
    throw error;
  }

  return mapEngagement((data ?? {}) as Record<string, unknown>);
}

export async function toggleGuideLike(
  postId: string,
): Promise<Pick<GuideEngagement, 'like_count' | 'liked'>> {
  const { data, error } = await supabase.rpc('toggle_kemi_post_like', {
    p_post_id: postId,
  });
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    like_count: Number(row.like_count) || 0,
    liked: Boolean(row.liked),
  };
}

export async function fetchGuideComments(postId: string): Promise<GuideComment[]> {
  const { data, error } = await supabase.rpc('list_kemi_post_comments', {
    p_post_id: postId,
  });

  if (error) {
    if (isMissingRpcError(error.message)) return fetchCommentsFallback(postId);
    throw error;
  }

  return (data ?? []).map((row: Record<string, unknown>) => mapComment(row));
}

export async function createGuideComment(
  postId: string,
  content: string,
  authorLabel?: string,
): Promise<GuideComment> {
  const { data, error } = await supabase.rpc('create_kemi_post_comment', {
    p_post_id: postId,
    p_content: content.trim(),
    p_author_label: authorLabel ?? '회원',
  });
  if (error) throw error;
  return mapComment(data as Record<string, unknown>);
}

export function parseGuideSocialError(message: string): string {
  if (message.includes('not_authenticated')) return '로그인이 필요합니다.';
  if (message.includes('content_too_short')) return '댓글을 입력해 주세요.';
  if (message.includes('post_not_found')) return '게시물을 찾을 수 없습니다.';
  return message;
}

export function formatGuideCommentTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return iso;
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return '방금';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function subscribeGuideSocial(postId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`guide_social_web_${postId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kemi_post_comments', filter: `post_id=eq.${postId}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'kemi_posts', filter: `id=eq.${postId}` },
      onChange,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kemi_post_likes', filter: `post_id=eq.${postId}` },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
