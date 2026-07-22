import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchGuides,
  subscribeGuides,
  type KemiGuideSummary,
} from '@/services/kemiPostService';

type Options = {
  limit?: number;
  /** 화면 포커스 시 자동 갱신 (기본 true) */
  refetchOnFocus?: boolean;
  /** Supabase Realtime 구독 (기본 true) */
  realtime?: boolean;
};

export function useKemiGuides(options?: Options) {
  const limit = options?.limit ?? 30;
  const refetchOnFocus = options?.refetchOnFocus ?? true;
  const realtime = options?.realtime ?? true;

  const [guides, setGuides] = useState<KemiGuideSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchGuides({ limit });
      setGuides(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : '가이드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!realtime) return undefined;
    return subscribeGuides(() => {
      void reload();
    });
  }, [realtime, reload]);

  useFocusEffect(
    useCallback(() => {
      if (!refetchOnFocus) return undefined;
      void reload();
      return undefined;
    }, [refetchOnFocus, reload]),
  );

  return { guides, loading, error, reload };
}
