import { supabase } from '../lib/supabase';

export type KemixGuideSummary = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  views: number;
  seo_title: string | null;
  seo_description: string | null;
  category: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type KemixGuide = KemixGuideSummary & {
  content: string;
  is_published: boolean;
};

export type GuideCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
};

export type PlatformStats = {
  download_count: number;
  guide_count: number;
  community_count: number;
};

const FALLBACK_STATS: PlatformStats = {
  download_count: 0,
  guide_count: 0,
  community_count: 0,
};

const FALLBACK_CATEGORIES: GuideCategory[] = [
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

export async function fetchGuideCategories(): Promise<GuideCategory[]> {
  try {
    const { data, error } = await supabase.rpc('list_active_post_categories');
    if (error || !data?.length) return FALLBACK_CATEGORIES;
    return (data as GuideCategory[]).filter((c) => c.is_active);
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export type FetchGuidesOptions = {
  limit?: number;
  offset?: number;
  categorySlug?: string | null;
  search?: string;
  categories?: GuideCategory[];
};

/** 웹·앱 공용 — 발행된 가이드 목록 (카테고리·검색 필터 지원) */
export async function fetchGuidesFiltered(options: FetchGuidesOptions = {}): Promise<KemixGuideSummary[]> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const search = options.search?.trim() ?? '';

  let categoryName: string | null = null;
  if (options.categorySlug) {
    const cats = options.categories ?? (await fetchGuideCategories());
    categoryName = cats.find((c) => c.slug === options.categorySlug)?.name ?? null;
  }

  try {
    let query = supabase
      .from('kemi_posts')
      .select(
        'id, title, slug, thumbnail_url, views, seo_title, seo_description, category, summary, created_at, updated_at',
      )
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryName) {
      query = query.eq('category', categoryName);
    }

    if (search) {
      const term = escapeIlike(search);
      query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%,content.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as KemixGuideSummary[];
  } catch {
    return fetchGuidesLegacy(limit, offset);
  }
}

/** 레거시 RPC 폴백 (category 컬럼 미적용 환경) */
export async function fetchGuides(limit = 30, offset = 0): Promise<KemixGuideSummary[]> {
  return fetchGuidesFiltered({ limit, offset });
}

async function fetchGuidesLegacy(limit: number, offset: number): Promise<KemixGuideSummary[]> {
  const { data, error } = await supabase.rpc('list_published_kemi_posts', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return ((data ?? []) as KemixGuideSummary[]).map((row) => ({
    ...row,
    category: row.category ?? null,
    summary: row.summary ?? null,
  }));
}

export async function fetchGuideBySlug(slug: string): Promise<KemixGuide | null> {
  const { data, error } = await supabase.rpc('get_kemi_post_by_slug', { p_slug: slug });
  if (error) throw error;
  return (data as KemixGuide | null) ?? null;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const { data, error } = await supabase.rpc('get_kemi_platform_stats');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return FALLBACK_STATS;
    const r = row as Record<string, unknown>;
    const downloads = Number(r.download_count);
    const guides = Number(r.guide_count);
    const community =
      r.community_count != null ? Number(r.community_count) : Number(r.active_paramedic_count);
    return {
      download_count: Number.isFinite(downloads) ? downloads : FALLBACK_STATS.download_count,
      guide_count: Number.isFinite(guides) ? guides : 0,
      community_count: Number.isFinite(community) ? community : 0,
    };
  } catch {
    return FALLBACK_STATS;
  }
}

export function subscribeGuides(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemix_posts_web')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kemi_posts' }, () => onChange())
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeGuideCategories(onChange: () => void): () => void {
  try {
    const channel = supabase
      .channel('kemix_post_categories_web')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kemix_post_categories' },
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

export function formatGuideDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatStatNumber(value: number): string {
  return value.toLocaleString('ko-KR');
}

export function getGuideExcerpt(post: KemixGuideSummary): string {
  if (post.summary?.trim()) return post.summary.trim();
  if (post.seo_description?.trim()) return post.seo_description.trim();
  return '';
}

export function getGuideCategoryLabel(category: string | null | undefined): string {
  if (!category?.trim()) return '기타';
  return category.trim();
}
