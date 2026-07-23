import { Image } from 'react-native';
import { OPENING_SLIDES } from '@/constants/openingSlides';
import { supabase } from '@/lib/supabaseClient';
import type { OpeningSlide } from '@/types/openingSlide';

const resolvedCache = new Map<string, string>();

async function tryPrefetch(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    await Image.prefetch(url);
    return true;
  } catch {
    return false;
  }
}

/** 이미지 로드 실패 시 fallback URL 사용 */
export async function resolveSlideImageUrl(slide: OpeningSlide): Promise<string> {
  const cacheKey = `${slide.id}:${slide.image_url}`;
  const cached = resolvedCache.get(cacheKey);
  if (cached) return cached;

  if (await tryPrefetch(slide.image_url)) {
    resolvedCache.set(cacheKey, slide.image_url);
    return slide.image_url;
  }

  if (slide.fallback_url && (await tryPrefetch(slide.fallback_url))) {
    resolvedCache.set(cacheKey, slide.fallback_url);
    return slide.fallback_url;
  }

  resolvedCache.set(cacheKey, slide.image_url);
  return slide.image_url;
}

export async function resolveSlideImages(slides: OpeningSlide[]): Promise<OpeningSlide[]> {
  return Promise.all(
    slides.map(async (slide) => {
      const image_url = await resolveSlideImageUrl(slide);
      return { ...slide, image_url };
    }),
  );
}

function normalizeDbSlide(row: Record<string, unknown>): OpeningSlide | null {
  if (!row.id || !row.image_url) return null;
  return {
    id: String(row.id),
    image_url: String(row.image_url),
    fallback_url: row.fallback_url ? String(row.fallback_url) : null,
    title: String(row.title ?? ''),
    caption: row.caption ? String(row.caption) : null,
    display_order: Number(row.display_order) || 0,
    is_active: row.is_active !== false,
    source: 'db',
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/**
 * 오프닝 슬라이드 로더
 * 우선순위: Supabase DB → 로컬 fallback
 */
export async function fetchOpeningSlides(): Promise<OpeningSlide[]> {
  try {
    const { data, error } = await supabase.rpc('list_active_opening_slides');
    if (!error && Array.isArray(data) && data.length > 0) {
      const dbSlides = data
        .map((row) => normalizeDbSlide(row as Record<string, unknown>))
        .filter((s): s is OpeningSlide => s !== null)
        .sort((a, b) => a.display_order - b.display_order);
      if (dbSlides.length > 0) {
        return resolveSlideImages(dbSlides);
      }
    }
  } catch {
    // RPC 미적용 시 로컬 fallback
  }

  const local = OPENING_SLIDES.filter((s) => s.is_active).sort(
    (a, b) => a.display_order - b.display_order,
  );
  return resolveSlideImages(local);
}

export function preloadSlideImages(slides: OpeningSlide[]): Promise<void> {
  if (slides.length === 0) return Promise.resolve();
  return Promise.all(slides.map((s) => resolveSlideImageUrl(s))).then(() => undefined);
}
