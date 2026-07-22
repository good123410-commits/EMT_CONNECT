import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

export type KemiPostSummary = {
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

export type KemiPost = KemiPostSummary & {
  content: string;
  is_published: boolean;
};

export async function fetchPublishedPosts(limit = 30): Promise<KemiPostSummary[]> {
  const { data, error } = await supabase.rpc('list_published_kemi_posts', {
    p_limit: limit,
    p_offset: 0,
  });
  if (error) throw error;
  return (data ?? []) as KemiPostSummary[];
}

export async function fetchPostBySlug(slug: string): Promise<KemiPost | null> {
  const { data, error } = await supabase.rpc('get_kemi_post_by_slug', { p_slug: slug });
  if (error) throw error;
  return (data as KemiPost | null) ?? null;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
