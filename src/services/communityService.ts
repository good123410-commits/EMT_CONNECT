import { supabase } from '@/lib/supabaseClient';
import type {
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CommunityReaction,
  PaginatedPosts,
} from '@/types/community';
import { fetchCurrentUserNickname } from '@/utils/userNickname';

const QA_CATEGORY_SLUG = 'question';
const BOARD_PAGE_SIZE = 15;
const EMS_COMMUNITY_COMMENTS_TABLE = 'ems_community_comments';

type PostRow = CommunityPost & {
  kemix_community_categories?:
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
  category_slug?: string | null;
  category_name?: string | null;
  total_count?: number;
};

const FALLBACK_CATEGORIES: CommunityCategory[] = [
  { id: 'fallback-question', name: '질문&답변', slug: 'question', display_order: 1, is_active: true },
];

function resolveCategory(row: PostRow) {
  const raw = row.kemix_community_categories;
  if (!raw) {
    if (row.category_slug) {
      return {
        id: row.category_id ?? '',
        name: row.category_name ?? row.category_slug,
        slug: row.category_slug,
      };
    }
    return null;
  }
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export function mapCommunityPostRow(row: PostRow): CommunityPost {
  const cat = resolveCategory(row);
  return {
    id: row.id,
    post_type: row.post_type,
    title: row.title,
    summary: row.summary,
    content: row.content,
    anonymous_label: row.anonymous_label,
    likes: row.likes ?? 0,
    dislikes: row.dislikes ?? 0,
    is_hot: row.is_hot,
    author_id: row.author_id,
    created_at: row.created_at,
    is_hidden: row.is_hidden,
    is_notice: row.is_notice,
    category_id: row.category_id ?? cat?.id ?? null,
    category_slug: cat?.slug ?? row.category_slug ?? null,
    category_name: cat?.name ?? row.category_name ?? null,
    comment_count: row.comment_count ?? 0,
    my_reaction: row.my_reaction ?? null,
    is_secret: Boolean(row.is_secret),
  };
}

function mapComment(row: Record<string, unknown>): CommunityComment {
  const reaction = row.my_reaction;
  return {
    id: String(row.id ?? ''),
    post_id: String(row.post_id ?? ''),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    author_id: String(row.author_id ?? ''),
    anonymous_label: String(row.anonymous_label ?? '익명'),
    content: String(row.content ?? ''),
    likes: Number(row.likes) || 0,
    dislikes: Number(row.dislikes) || 0,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    my_reaction: reaction === 'like' || reaction === 'dislike' ? reaction : null,
  };
}

export async function fetchQaCategories(): Promise<CommunityCategory[]> {
  try {
    const { data, error } = await supabase.rpc('list_active_community_categories');
    if (error || !data?.length) return FALLBACK_CATEGORIES;
    return (data as CommunityCategory[]).filter((c) => c.is_active);
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function fetchQaPostsPage(page: number, pageSize = BOARD_PAGE_SIZE): Promise<PaginatedPosts> {
  try {
    const { data, error } = await supabase.rpc('list_bamboo_posts_page', {
      p_page: page,
      p_page_size: pageSize,
      p_category_slug: QA_CATEGORY_SLUG,
    });
    if (error) throw error;

    const rows = (data ?? []) as PostRow[];
    const totalCount = rows.length > 0 ? Number(rows[0].total_count) || 0 : 0;
    return {
      posts: rows.map((row) => mapCommunityPostRow(row)),
      totalCount,
      page,
      pageSize,
    };
  } catch {
    const { data, error } = await supabase
      .from('ems_community_posts')
      .select(
        'id, post_type, title, summary, content, anonymous_label, likes, dislikes, is_hot, author_id, created_at, is_hidden, is_notice, category_id, comment_count, kemix_community_categories ( id, name, slug )',
      )
      .eq('post_type', 'bamboo')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    const all = ((data ?? []) as PostRow[])
      .map((row) => mapCommunityPostRow(row))
      .filter((p) => p.category_slug === QA_CATEGORY_SLUG || !p.category_slug);
    const totalCount = all.length;
    const start = (page - 1) * pageSize;
    return {
      posts: all.slice(start, start + pageSize),
      totalCount,
      page,
      pageSize,
    };
  }
}

export async function fetchPostComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase.rpc('list_post_comments', { p_post_id: postId });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapComment(row));
}

export async function createQaPost(input: {
  title: string;
  content: string;
  authorLabel?: string;
  categoryId?: string | null;
  isSecret?: boolean;
}): Promise<CommunityPost> {
  let categoryId = input.categoryId ?? null;
  if (!categoryId) {
    const categories = await fetchQaCategories();
    categoryId = categories.find((item) => item.slug === QA_CATEGORY_SLUG)?.id ?? null;
  }

  const authorLabel = input.authorLabel?.trim() || (await fetchCurrentUserNickname());

  const { data, error } = await supabase.rpc('create_community_bamboo_post', {
    p_title: input.title.trim(),
    p_content: input.content.trim(),
    p_category_id: categoryId,
    p_category_slug: QA_CATEGORY_SLUG,
    p_anonymous_label: authorLabel,
    p_is_secret: input.isSecret ?? false,
  });
  if (error) throw error;
  if (!data) {
    throw new Error('create_failed');
  }
  return mapCommunityPostRow(data as PostRow);
}

export async function createPostComment(
  postId: string,
  content: string,
  parentId?: string | null,
  authorLabel?: string,
): Promise<CommunityComment> {
  const resolvedLabel = authorLabel?.trim() || (await fetchCurrentUserNickname());

  const { data, error } = await supabase.rpc('create_post_comment', {
    p_post_id: postId,
    p_content: content.trim(),
    p_parent_id: parentId ?? null,
    p_anonymous_label: resolvedLabel,
  });
  if (error) throw error;
  return mapComment(data as Record<string, unknown>);
}

export async function updatePostComment(
  commentId: string,
  content: string,
): Promise<CommunityComment> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('content_too_short');
  }

  const { data, error } = await supabase
    .from(EMS_COMMUNITY_COMMENTS_TABLE)
    .update({ content: trimmed })
    .eq('id', commentId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('comment_not_found');
  }

  return mapComment(data as Record<string, unknown>);
}

export async function deletePostComment(commentId: string): Promise<void> {
  const { data, error } = await supabase
    .from(EMS_COMMUNITY_COMMENTS_TABLE)
    .delete()
    .eq('id', commentId)
    .select('id');

  if (error) {
    throw error;
  }

  if (!data?.length) {
    throw new Error('comment_delete_failed');
  }
}

export async function fetchMyPostReactions(
  postIds: string[],
): Promise<Map<string, CommunityReaction>> {
  const map = new Map<string, CommunityReaction>();
  if (!postIds.length) return map;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return map;

  const { data, error } = await supabase
    .from('ems_community_post_reactions')
    .select('post_id, reaction')
    .eq('user_id', user.id)
    .in('post_id', postIds);

  if (error) {
    if (__DEV__) {
      console.warn('[community] fetchMyPostReactions failed', error.message);
    }
    return map;
  }

  for (const row of data ?? []) {
    const reaction = row.reaction;
    if (reaction === 'like' || reaction === 'dislike') {
      map.set(String(row.post_id), reaction);
    }
  }

  return map;
}

export function applyMyReactionsToRows<T extends { id: string }>(
  rows: T[],
  reactions: Map<string, CommunityReaction>,
): Array<T & { my_reaction: CommunityReaction | null }> {
  return rows.map((row) => ({
    ...row,
    my_reaction: reactions.get(row.id) ?? null,
  }));
}

export async function togglePostReaction(
  postId: string,
  reaction: CommunityReaction,
): Promise<{ likes: number; dislikes: number; my_reaction: CommunityReaction | null }> {
  const { data, error } = await supabase.rpc('toggle_ems_post_reaction', {
    p_post_id: postId,
    p_reaction: reaction,
  });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  const my = row.my_reaction;
  return {
    likes: Number(row.likes) || 0,
    dislikes: Number(row.dislikes) || 0,
    my_reaction: my === 'like' || my === 'dislike' ? my : null,
  };
}

export function formatRelativeTime(iso: string): string {
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

export function parseCommunityError(message: string): string {
  if (message.includes('not_authorized_answer')) {
    return '답변은 구급대원 및 관리자만 작성 가능합니다.';
  }
  if (message.includes('not_authenticated')) {
    return '로그인이 필요합니다.';
  }
  if (message.includes('title_too_short')) {
    return '제목을 2자 이상 입력해 주세요.';
  }
  if (message.includes('content_too_short')) {
    return '내용을 5자 이상 입력해 주세요.';
  }
  if (message.includes('comment_not_found')) {
    return '댓글을 찾을 수 없습니다.';
  }
  if (message.includes('comment_delete_failed')) {
    return '댓글을 삭제하지 못했습니다. 작성자 본인이거나 관리자 권한이 있는지 확인해 주세요.';
  }
  if (message.includes('row-level security')) {
    return '댓글 수정·삭제 권한이 없습니다.';
  }
  if (message.includes('create_failed')) {
    return '글 등록에 실패했습니다. 다시 시도해 주세요.';
  }
  return message;
}
