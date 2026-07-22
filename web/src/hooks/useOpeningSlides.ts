import { useEffect, useState } from 'react';
import { fetchOpeningSlides } from '../services/openingSlideService';
import type { OpeningSlide } from '../types';

export function useOpeningSlides() {
  const [slides, setSlides] = useState<OpeningSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchOpeningSlides();
        if (!cancelled) setSlides(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '슬라이드를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { slides, loading, error };
}
