import { supabase } from '../lib/supabase';
import type {
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CommunityReaction,
  PaginatedPosts,
  ReactionCounts,
} from '../types';

type PostRow = CommunityPost & {
  kemix_community_categories?:
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
  category_slug?: string | null;
  category_name?: string | null;
  total_count?: number;
};

function resolveCategory(
  row: PostRow,
): { id: string; name: string; slug: string } | null {
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

function mapPost(row: PostRow, myReaction?: CommunityReaction | null): CommunityPost {
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
    my_reaction: myReaction ?? row.my_reaction ?? null,
  };
}

const POST_SELECT = `
  id, post_type, title, summary, content, anonymous_label, likes, dislikes, is_hot,
  author_id, created_at, is_hidden, is_notice, category_id, comment_count,
  kemix_community_categories ( id, name, slug )
`;

const FALLBACK_CATEGORIES: CommunityCategory[] = [
  { id: 'fallback-free', name: '자유', slug: 'free', display_order: 1, is_active: true },
  { id: 'fallback-question', name: '질문&답변', slug: 'question', display_order: 2, is_active: true },
  { id: 'fallback-field', name: '현장 이야기', slug: 'field', display_order: 3, is_active: true },
  { id: 'fallback-info', name: '정보공유', slug: 'info', display_order: 4, is_active: true },
];

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
    my_reaction:
      reaction === 'like' || reaction === 'dislike' ? reaction : null,
  };
}

function parseReactionResult(data: unknown): ReactionCounts {
  const row = data as Record<string, unknown>;
  const my = row.my_reaction;
  return {
    likes: Number(row.likes) || 0,
    dislikes: Number(row.dislikes) || 0,
    my_reaction: my === 'like' || my === 'dislike' ? my : null,
  };
}

export async function fetchCommunityCategories(): Promise<CommunityCategory[]> {
  try {
    const { data, error } = await supabase.rpc('list_active_community_categories');
    if (error || !data?.length) return FALLBACK_CATEGORIES;
    return (data as CommunityCategory[]).filter((c) => c.is_active);
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function fetchBambooPostsPage(
  page: number,
  pageSize: number,
  categorySlug?: string | null,
): Promise<PaginatedPosts> {
  try {
    const { data, error } = await supabase.rpc('list_bamboo_posts_page', {
      p_page: page,
      p_page_size: pageSize,
      p_category_slug: categorySlug ?? null,
    });
    if (error) throw error;

    const rows = (data ?? []) as PostRow[];
    const totalCount = rows.length > 0 ? Number(rows[0].total_count) || 0 : 0;
    return {
      posts: rows.map((row) => mapPost(row)),
      totalCount,
      page,
      pageSize,
    };
  } catch {
    const all = await fetchBambooPosts(200);
    const filtered = categorySlug
      ? all.filter((p) => p.category_slug === categorySlug)
      : all;
    const totalCount = filtered.length;
    const start = (page - 1) * pageSize;
    return {
      posts: filtered.slice(start, start + pageSize),
      totalCount,
      page,
      pageSize,
    };
  }
}

export async function fetchDailyBestPosts(limit = 10): Promise<CommunityPost[]> {
  try {
    const { data, error } = await supabase.rpc('list_daily_best_posts', { p_limit: limit });
    if (error) throw error;
    return ((data ?? []) as PostRow[]).map((row) => mapPost(row));
  } catch {
    const all = await fetchBambooPosts(100);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return all
      .filter((p) => new Date(p.created_at).getTime() >= cutoff)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  }
}

export async function fetchBambooPosts(limit = 50): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('ems_community_posts')
    .select(POST_SELECT)
    .eq('post_type', 'bamboo')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('ems_community_posts')
      .select(
        'id, post_type, title, summary, content, anonymous_label, likes, is_hot, author_id, created_at, is_hidden',
      )
      .eq('post_type', 'bamboo')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fallbackError) throw fallbackError;
    return ((fallbackData ?? []) as CommunityPost[]).filter((p) => !p.is_hidden);
  }

  return ((data ?? []) as PostRow[]).map((row) => mapPost(row));
}

export async function fetchMyPostReaction(postId: string): Promise<CommunityReaction | null> {
  const { data, error } = await supabase.rpc('get_my_post_reaction', { p_post_id: postId });
  if (error) return null;
  return data === 'like' || data === 'dislike' ? data : null;
}

export async function togglePostReaction(
  postId: string,
  reaction: CommunityReaction,
): Promise<ReactionCounts> {
  const { data, error } = await supabase.rpc('toggle_ems_post_reaction', {
    p_post_id: postId,
    p_reaction: reaction,
  });
  if (error) throw error;
  return parseReactionResult(data);
}

export async function toggleCommentReaction(
  commentId: string,
  reaction: CommunityReaction,
): Promise<ReactionCounts> {
  const { data, error } = await supabase.rpc('toggle_ems_comment_reaction', {
    p_comment_id: commentId,
    p_reaction: reaction,
  });
  if (error) throw error;
  return parseReactionResult(data);
}

export async function fetchPostComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase.rpc('list_post_comments', { p_post_id: postId });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapComment(row));
}

export async function createPostComment(
  postId: string,
  content: string,
  parentId?: string | null,
  authorLabel?: string,
): Promise<CommunityComment> {
  const { data, error } = await supabase.rpc('create_post_comment', {
    p_post_id: postId,
    p_content: content.trim(),
    p_parent_id: parentId ?? null,
    p_anonymous_label: authorLabel ?? '익명',
  });
  if (error) throw error;
  return mapComment(data as Record<string, unknown>);
}

export async function submitCommunityReport(input: {
  targetType: 'post' | 'comment';
  targetId: string;
  reason: string;
  preview?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('submit_community_report', {
    p_target_type: input.targetType,
    p_target_id: input.targetId,
    p_reason: input.reason.trim(),
    p_preview: input.preview?.trim() ?? null,
  });
  if (error) throw error;
}

export type CreateCommunityPostInput = {
  title: string;
  content: string;
  categoryId: string;
  categorySlug?: string | null;
  userId: string;
  authorLabel?: string;
};

function buildSummary(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = (div.textContent ?? div.innerText ?? '').replace(/\s+/g, ' ').trim();
  return text.slice(0, 160);
}

export async function createCommunityPost(input: CreateCommunityPostInput): Promise<void> {
  const { error } = await supabase.rpc('create_community_bamboo_post', {
    p_title: input.title,
    p_content: input.content,
    p_category_id: input.categoryId?.startsWith('fallback-') ? null : input.categoryId || null,
    p_category_slug: input.categorySlug ?? 'question',
    p_anonymous_label: input.authorLabel ?? '웹 회원',
  });

  if (error) throw error;
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

export function subscribeCommunityPosts(onChange: () => void): () => void {
  try {
    const channel = supabase
      .channel('kemix_community_web')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ems_community_posts' },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ems_community_comments' },
        () => onChange(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => undefined;
  }
}
