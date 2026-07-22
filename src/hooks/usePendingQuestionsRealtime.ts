import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import type { UserQuestion } from '@/lib/supabaseClient';
import { subscribePendingQuestionsChanges } from '@/lib/realtimeSubscription';
import { fetchPendingQuestions } from '@/services/questionService';

export function usePendingQuestionsRealtime() {
  const [pending, setPending] = useState<UserQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const items = await fetchPendingQuestions();
      setPending(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '대기 질문을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const onChange = () => {
      if (!active) return;
      void reload();
    };

    void reload();
    const unsubscribe = subscribePendingQuestionsChanges(onChange);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { pending, loading, error, reload };
}
