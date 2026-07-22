import { useEffect, useState } from 'react';
import { fetchAboutPage } from '../services/aboutPageService';
import type { AboutPageSlug, KemixAboutPage } from '../types';
import { getAboutFallback } from '../constants/aboutPages';

export function useAboutPage(slug: AboutPageSlug) {
  const fallback = getAboutFallback(slug);
  const [page, setPage] = useState<KemixAboutPage | null>(
    fallback ? { ...fallback, subtitle: fallback.subtitle, is_published: true } : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const row = await fetchAboutPage(slug);
        if (!cancelled) setPage(row);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { page, loading };
}
