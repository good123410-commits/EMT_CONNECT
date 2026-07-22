import { supabase } from '@/lib/supabaseClient';
import { subscribeKemiPostsTable } from '@/lib/realtimeSubscription';
import type { KemiGuide, KemiGuideSummary } from '@/types/kemiGuide';
import type { KemiPost } from '@/types/kemiPost';
import { safeAsync } from '@/utils/resilientAsync';

export type { KemiGuide, KemiGuideSummary } from '@/types/kemiGuide';

export type KemiPostCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
};

const KEMI_POSTS_TABLE = 'kemi_posts';
const KEMI_POST_CATEGORIES_TABLE = 'kemix_post_categories';

const FALLBACK_CATEGORIES: KemiPostCategory[] = [
  { id: 'fb-cpr', name: '심폐소생술', slug: 'cpr', display_order: 1, is_active: true },
  { id: 'fb-trauma', name: '외상', slug: 'trauma', display_order: 2, is_active: true },
  { id: 'fb-poisoning', name: '중독', slug: 'poisoning', display_order: 3, is_active: true },
  { id: 'fb-pediatric', name: '소아', slug: 'pediatric', display_order: 4, is_active: true },
  { id: 'fb-burn', name: '화상', slug: 'burn', display_order: 5, is_active: true },
  { id: 'fb-general', name: '기타', slug: 'general', display_order: 6, is_active: true },
];

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

function buildSummary(content: string): string {
  const text = stripGuideHtml(content).replace(/\s+/g, ' ').trim();
  return text.slice(0, 160);
}

function uniqueSlug(base: string): string {
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .slice(0, 72);
  return `${normalized || 'guide'}-${Date.now().toString(36)}`;
}

/**
 * 웹·앱 공용 — 발행된 생활 응급처치 가이드 목록 (최신순)
 */
export async function fetchGuides(options?: {
  limit?: number;
  offset?: number;
  category?: string | null;
  search?: string;
}): Promise<KemiGuideSummary[]> {
  const limit = options?.limit ?? 30;
  const offset = options?.offset ?? 0;
  const search = options?.search?.trim() ?? '';
  const category = options?.category?.trim() ?? '';

  try {
    let query = supabase
      .from(KEMI_POSTS_TABLE)
      .select(
        'id, title, slug, thumbnail_url, views, seo_title, seo_description, category, summary, created_at, updated_at',
      )
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      const term = escapeIlike(search);
      query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%,content.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as KemiGuideSummary[];
  } catch {
    return safeAsync(
      async () => {
        const { data, error } = await supabase.rpc('list_published_kemi_posts', {
          p_limit: limit,
          p_offset: offset,
        });
        if (error) throw error;
        return (data ?? []) as KemiGuideSummary[];
      },
      [],
      'fetchGuides',
    );
  }
}

export async function fetchGuideCategories(): Promise<KemiPostCategory[]> {
  return safeAsync(
    async () => {
      const { data, error } = await supabase.rpc('list_active_post_categories');
      if (error) throw error;
      const rows = (data ?? []) as KemiPostCategory[];
      return rows.length > 0 ? rows.filter((row) => row.is_active) : FALLBACK_CATEGORIES;
    },
    FALLBACK_CATEGORIES,
    'fetchGuideCategories',
  );
}

export async function fetchGuideBySlug(slug: string): Promise<KemiGuide | null> {
  return safeAsync(
    async () => {
      const { data, error } = await supabase.rpc('get_kemi_post_by_slug', {
        p_slug: slug,
      });
      if (error) throw error;
      return (data as KemiPost | null) ?? null;
    },
    null,
    'fetchGuideBySlug',
  );
}

export async function fetchGuideById(id: string): Promise<KemiGuide | null> {
  return safeAsync(
    async () => {
      const { data, error } = await supabase
        .from(KEMI_POSTS_TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as KemiPost | null) ?? null;
    },
    null,
    'fetchGuideById',
  );
}

export type UpsertKemiGuideInput = {
  id?: string;
  title: string;
  category: string;
  content: string;
  isPublished?: boolean;
};

export async function createKemiGuide(input: UpsertKemiGuideInput): Promise<KemiGuide> {
  const title = input.title.trim();
  const category = input.category.trim() || '기타';
  const content = input.content.trim();
  if (!title || !content) {
    throw new Error('제목과 본문을 입력해 주세요.');
  }

  const payload = {
    title,
    slug: uniqueSlug(title),
    content,
    category,
    summary: buildSummary(content),
    is_published: input.isPublished ?? true,
  };

  const { data, error } = await supabase.from(KEMI_POSTS_TABLE).insert(payload).select('*').single();
  if (error) throw new Error(`가이드 저장 실패: ${error.message}`);
  return data as KemiGuide;
}

export async function updateKemiGuide(input: UpsertKemiGuideInput & { id: string }): Promise<KemiGuide> {
  const id = input.id.trim();
  const title = input.title.trim();
  const category = input.category.trim() || '기타';
  const content = input.content.trim();
  if (!id) throw new Error('수정할 가이드를 찾을 수 없습니다.');
  if (!title || !content) throw new Error('제목과 본문을 입력해 주세요.');

  const { data, error } = await supabase
    .from(KEMI_POSTS_TABLE)
    .update({
      title,
      category,
      content,
      summary: buildSummary(content),
      is_published: input.isPublished ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`가이드 수정 실패: ${error.message}`);
  return data as KemiGuide;
}

export async function deleteKemiGuide(id: string): Promise<void> {
  const trimmedId = id.trim();
  if (!trimmedId) throw new Error('삭제할 가이드를 찾을 수 없습니다.');

  const { data, error } = await supabase
    .from(KEMI_POSTS_TABLE)
    .delete()
    .eq('id', trimmedId)
    .select('id');

  if (error) throw new Error(`가이드 삭제 실패: ${error.message}`);
  if (!data?.length) throw new Error('가이드가 삭제되지 않았습니다.');
}

/** @deprecated fetchGuides 사용 */
export const fetchPublishedKemiPosts = fetchGuides;

/** @deprecated fetchGuideBySlug 사용 */
export const fetchKemiPostBySlug = fetchGuideBySlug;

export function subscribeGuides(onChange: () => void): () => void {
  return subscribeKemiPostsTable(onChange);
}

export function formatKemiPostDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function slugifyKemiPostTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .slice(0, 80);
}

export function stripGuideHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

export function extractGuideImageUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match = regex.exec(html);
  while (match) {
    if (match[1]) urls.push(match[1]);
    match = regex.exec(html);
  }
  return urls;
}
