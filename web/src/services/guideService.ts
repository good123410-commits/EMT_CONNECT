import { supabase } from '../lib/supabase';

export type KemiGuideSummary = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  views: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type KemiGuide = KemiGuideSummary & {
  content: string;
  is_published: boolean;
};

export type PlatformStats = {
  hospital_count: number;
  guide_count: number;
  active_paramedic_count: number;
};

const FALLBACK_STATS: PlatformStats = {
  hospital_count: 2968,
  guide_count: 0,
  active_paramedic_count: 0,
};

/** 웹·앱 공용 — 발행된 가이드 목록 (최신순) */
export async function fetchGuides(limit = 30, offset = 0): Promise<KemiGuideSummary[]> {
  const { data, error } = await supabase.rpc('list_published_kemi_posts', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data ?? []) as KemiGuideSummary[];
}

export async function fetchGuideBySlug(slug: string): Promise<KemiGuide | null> {
  const { data, error } = await supabase.rpc('get_kemi_post_by_slug', { p_slug: slug });
  if (error) throw error;
  return (data as KemiGuide | null) ?? null;
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const { data, error } = await supabase.rpc('get_kemi_platform_stats');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return FALLBACK_STATS;
    return {
      hospital_count: Number(row.hospital_count) || FALLBACK_STATS.hospital_count,
      guide_count: Number(row.guide_count) || 0,
      active_paramedic_count: Number(row.active_paramedic_count) || 0,
    };
  } catch {
    return FALLBACK_STATS;
  }
}

export function subscribeGuides(onChange: () => void): () => void {
  const channel = supabase
    .channel('kemi_posts_web')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kemi_posts' },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
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
