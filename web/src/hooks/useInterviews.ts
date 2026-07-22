import { useCallback, useEffect, useState } from 'react';
import {
  fetchFeaturedInterview,
  fetchPublishedInterviews,
  subscribeInterviews,
} from '../services/interviewService';
import type { MonthlyInterview } from '../types';

export function useInterviews(limit = 12) {
  const [interviews, setInterviews] = useState<MonthlyInterview[]>([]);
  const [featured, setFeatured] = useState<MonthlyInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [list, feat] = await Promise.all([
        fetchPublishedInterviews(limit),
        fetchFeaturedInterview(),
      ]);
      setInterviews(list);
      setFeatured(feat);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인터뷰를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeInterviews(() => void reload());
    return unsubscribe;
  }, [reload]);

  return { interviews, featured, loading, error, reload };
}
