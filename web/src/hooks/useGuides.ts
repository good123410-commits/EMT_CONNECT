import { useCallback, useEffect, useState } from 'react';
import {
  fetchGuides,
  subscribeGuides,
  type KemixGuideSummary,
} from '../services/guideService';

export function useGuides(limit = 30) {
  const [guides, setGuides] = useState<KemixGuideSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchGuides(limit);
      setGuides(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '가이드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeGuides(() => {
      void reload();
    });
    return unsubscribe;
  }, [reload]);

  return { guides, loading, error, reload };
}
