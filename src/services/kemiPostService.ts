import { supabase } from '@/lib/supabaseClient';
import { subscribeKemiPostsTable } from '@/lib/realtimeSubscription';
import type { KemiGuide, KemiGuideSummary } from '@/types/kemiGuide';
import type { KemiPost } from '@/types/kemiPost';
import { safeAsync } from '@/utils/resilientAsync';

export type { KemiGuide, KemiGuideSummary } from '@/types/kemiGuide';

/**
 * 웹·앱 공용 — 발행된 생활 응급처치 가이드 목록 (최신순)
 * Supabase `kemi_posts` · `is_published = true`
 */
export async function fetchGuides(options?: {
  limit?: number;
  offset?: number;
}): Promise<KemiGuideSummary[]> {
  return safeAsync(
    async () => {
      const { data, error } = await supabase.rpc('list_published_kemi_posts', {
        p_limit: options?.limit ?? 30,
        p_offset: options?.offset ?? 0,
      });
      if (error) throw error;
      return (data ?? []) as KemiGuideSummary[];
    },
    [],
    'fetchGuides',
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
