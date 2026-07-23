import { supabase } from '@/lib/supabaseClient';
import type {
  CommunityCategory,
  CommunityComment,
  CommunityPost,
  CommunityReaction,
  PaginatedPosts,
} from '@/types/community';

const QA_CATEGORY_SLUG = 'question';
const BOARD_PAGE_SIZE = 15;

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

function mapPost(row: PostRow): CommunityPost {
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
      posts: rows.map((row) => mapPost(row)),
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
      .map((row) => mapPost(row))
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
}): Promise<CommunityPost> {
  const { data, error } = await supabase.rpc('create_community_bamboo_post', {
    p_title: input.title.trim(),
    p_content: input.content.trim(),
    p_category_id: input.categoryId ?? null,
    p_category_slug: QA_CATEGORY_SLUG,
    p_anonymous_label: input.authorLabel ?? '회원',
  });
  if (error) throw error;
  return mapPost(data as PostRow);
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
  return message;
}
