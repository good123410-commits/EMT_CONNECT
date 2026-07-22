import { supabase } from '../lib/supabase';
import type { CommunityCategory, CommunityPost } from '../types';

type PostRow = CommunityPost & {
  kemix_community_categories?:
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
};

function resolveCategory(
  row: PostRow,
): { id: string; name: string; slug: string } | null {
  const raw = row.kemix_community_categories;
  if (!raw) return null;
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
    likes: row.likes,
    is_hot: row.is_hot,
    author_id: row.author_id,
    created_at: row.created_at,
    is_hidden: row.is_hidden,
    is_notice: row.is_notice,
    category_id: row.category_id ?? cat?.id ?? null,
    category_slug: cat?.slug ?? null,
    category_name: cat?.name ?? null,
    comment_count: row.comment_count ?? 0,
  };
}

const POST_SELECT = `
  id, post_type, title, summary, content, anonymous_label, likes, is_hot,
  author_id, created_at, is_hidden, is_notice, category_id,
  kemix_community_categories ( id, name, slug )
`;

const FALLBACK_CATEGORIES: CommunityCategory[] = [
  { id: 'fallback-free', name: '자유', slug: 'free', display_order: 1, is_active: true },
  { id: 'fallback-question', name: '질문&답변', slug: 'question', display_order: 2, is_active: true },
  { id: 'fallback-field', name: '현장 이야기', slug: 'field', display_order: 3, is_active: true },
  { id: 'fallback-info', name: '정보공유', slug: 'info', display_order: 4, is_active: true },
];

export async function fetchCommunityCategories(): Promise<CommunityCategory[]> {
  try {
    const { data, error } = await supabase.rpc('list_active_community_categories');
    if (error || !data?.length) return FALLBACK_CATEGORIES;
    return (data as CommunityCategory[]).filter((c) => c.is_active);
  } catch {
    return FALLBACK_CATEGORIES;
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
      .select('id, post_type, title, summary, content, anonymous_label, likes, is_hot, author_id, created_at, is_hidden')
      .eq('post_type', 'bamboo')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fallbackError) throw fallbackError;
    return ((fallbackData ?? []) as CommunityPost[]).filter((p) => !p.is_hidden);
  }

  return ((data ?? []) as PostRow[]).map(mapPost);
}

export type CreateCommunityPostInput = {
  title: string;
  content: string;
  categoryId: string;
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
  const summary = buildSummary(input.content);
  const payload: Record<string, unknown> = {
    post_type: 'bamboo',
    title: input.title,
    summary,
    content: input.content,
    author_id: input.userId,
    anonymous_label: input.authorLabel ?? '웹 회원',
  };

  if (!input.categoryId.startsWith('fallback-')) {
    payload.category_id = input.categoryId;
  }

  const { error } = await supabase.from('ems_community_posts').insert(payload);
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
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => undefined;
  }
}
