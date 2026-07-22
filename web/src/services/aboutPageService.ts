import { ABOUT_PAGE_FALLBACKS, getAboutFallback } from '../constants/aboutPages';
import { supabase } from '../lib/supabase';
import type { AboutPageSlug, KemixAboutPage } from '../types';

export async function fetchAboutPage(slug: AboutPageSlug): Promise<KemixAboutPage> {
  const fallback = getAboutFallback(slug);
  try {
    const { data, error } = await supabase.rpc('get_published_about_page', { p_slug: slug });
    if (!error && data) {
      const row = data as KemixAboutPage;
      return {
        slug: row.slug as AboutPageSlug,
        eyebrow: row.eyebrow,
        title: row.title,
        subtitle: row.subtitle,
        content: row.content,
        is_published: row.is_published,
      };
    }
  } catch {
    // RPC 미적용 시 fallback
  }

  if (fallback) {
    return { ...fallback, subtitle: fallback.subtitle, is_published: true };
  }

  return {
    slug,
    eyebrow: 'About KEMIX',
    title: slug,
    subtitle: null,
    content: '',
    is_published: true,
  };
}

export async function fetchAllAboutPages(): Promise<KemixAboutPage[]> {
  const slugs: AboutPageSlug[] = ['vision', 'history', 'structure', 'dev-log'];
  try {
    const { data, error } = await supabase.rpc('admin_list_about_pages');
    if (!error && Array.isArray(data) && data.length > 0) {
      return slugs.map((slug) => {
        const row = (data as KemixAboutPage[]).find((p) => p.slug === slug);
        const fb = getAboutFallback(slug);
        return row ?? { ...fb!, subtitle: fb!.subtitle, is_published: true };
      });
    }
  } catch {
    // admin only RPC on public - use fallbacks for public
  }
  return ABOUT_PAGE_FALLBACKS.map((f) => ({ ...f, subtitle: f.subtitle, is_published: true }));
}
