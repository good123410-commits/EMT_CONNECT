import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

export const MY_QUESTIONS_QUERY_KEY = 'my-questions' as const;
export const MY_QUESTIONS_PAGE_SIZE = 20;
export const FACILITY_MARKERS_QUERY_KEY = 'facility-markers' as const;
