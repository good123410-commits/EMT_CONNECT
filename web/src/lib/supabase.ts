import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** 앱과 동일한 Supabase 프로젝트 · 세션은 localStorage에 유지 */
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type KemixPostSummary = {
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

export type KemixPost = KemixPostSummary & {
  content: string;
  is_published: boolean;
};

export async function fetchPublishedPosts(limit = 30): Promise<KemixPostSummary[]> {
  const { data, error } = await supabase.rpc('list_published_kemi_posts', {
    p_limit: limit,
    p_offset: 0,
  });
  if (error) throw error;
  return (data ?? []) as KemixPostSummary[];
}

export async function fetchPostBySlug(slug: string): Promise<KemixPost | null> {
  const { data, error } = await supabase.rpc('get_kemi_post_by_slug', { p_slug: slug });
  if (error) throw error;
  return (data as KemixPost | null) ?? null;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
