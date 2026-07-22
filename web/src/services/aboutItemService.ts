import { getAboutItemFallbacks } from '../constants/aboutItemFallbacks';
import { supabase } from '../lib/supabase';
import type { AboutItemPageSlug, KemixAboutItem } from '../types';

export async function fetchPublishedAboutItems(pageSlug: AboutItemPageSlug): Promise<KemixAboutItem[]> {
  try {
    const { data, error } = await supabase.rpc('list_published_about_items', {
      p_page_slug: pageSlug,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data as KemixAboutItem[];
    }
  } catch {
    // fallback below
  }
  return getAboutItemFallbacks(pageSlug);
}
