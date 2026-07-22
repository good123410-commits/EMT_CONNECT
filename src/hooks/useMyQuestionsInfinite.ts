import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  MY_QUESTIONS_PAGE_SIZE,
  MY_QUESTIONS_QUERY_KEY,
} from '@/lib/queryClient';
import { subscribeUserQuestionsChanges } from '@/lib/realtimeSubscription';
import { fetchMyQuestionsPage } from '@/services/questionService';

export function useMyQuestionsInfinite(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: [MY_QUESTIONS_QUERY_KEY, userId],
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchMyQuestionsPage(userId!, pageParam, MY_QUESTIONS_PAGE_SIZE),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
  });

  useEffect(() => {
    if (!userId) return undefined;

    const unsubscribe = subscribeUserQuestionsChanges(userId, () => {
      void queryClient.invalidateQueries({ queryKey: [MY_QUESTIONS_QUERY_KEY, userId] });
    });

    return unsubscribe;
  }, [queryClient, userId]);

  return query;
}
