import { supabase } from '@/lib/supabaseClient';
import type { KemiGuideComment, KemiGuideEngagement } from '@/types/kemiGuideSocial';

const EMPTY_ENGAGEMENT: KemiGuideEngagement = {
  like_count: 0,
  comment_count: 0,
  liked: false,
};

function mapEngagement(row: Record<string, unknown>): KemiGuideEngagement {
  return {
    like_count: Number(row.like_count) || 0,
    comment_count: Number(row.comment_count) || 0,
    liked: Boolean(row.liked),
  };
}

function mapComment(row: Record<string, unknown>): KemiGuideComment {
  return {
    id: String(row.id ?? ''),
    post_id: String(row.post_id ?? ''),
    author_id: String(row.author_id ?? ''),
    author_label: String(row.author_label ?? '회원'),
    content: String(row.content ?? ''),
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

export async function fetchKemiGuideEngagement(postId: string): Promise<KemiGuideEngagement> {
  const { data, error } = await supabase.rpc('get_kemi_post_engagement', {
    p_post_id: postId,
  });
  if (error) {
    if (error.message.includes('post_not_found')) {
      return EMPTY_ENGAGEMENT;
    }
    throw error;
  }
  return mapEngagement((data ?? {}) as Record<string, unknown>);
}

export async function toggleKemiGuideLike(
  postId: string,
): Promise<Pick<KemiGuideEngagement, 'like_count' | 'liked'>> {
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

export async function fetchKemiGuideComments(postId: string): Promise<KemiGuideComment[]> {
  const { data, error } = await supabase.rpc('list_kemi_post_comments', {
    p_post_id: postId,
  });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapComment(row));
}

export async function createKemiGuideComment(
  postId: string,
  content: string,
  authorLabel?: string,
): Promise<KemiGuideComment> {
  const { data, error } = await supabase.rpc('create_kemi_post_comment', {
    p_post_id: postId,
    p_content: content.trim(),
    p_author_label: authorLabel ?? '회원',
  });
  if (error) throw error;
  return mapComment(data as Record<string, unknown>);
}

export function parseKemiGuideSocialError(message: string): string {
  if (message.includes('not_authenticated')) {
    return '로그인이 필요합니다.';
  }
  if (message.includes('content_too_short')) {
    return '댓글을 입력해 주세요.';
  }
  if (message.includes('post_not_found')) {
    return '게시물을 찾을 수 없습니다.';
  }
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
