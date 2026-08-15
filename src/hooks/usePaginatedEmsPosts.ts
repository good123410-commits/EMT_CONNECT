import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCommunitySpotlightPosts,
  fetchDailyBestBambooPosts,
  fetchEmsCommunityPostsPage,
} from '@/services/communityListService';
import type { EmsCommunityPostRow, EmsCommunityPostType } from '@/services/emsCommunityService';
import type {
  CommunityJobTypeFilter,
  CommunityListSort,
  CommunitySortOption,
} from '@/types/communityList';
import { COMMUNITY_LIST_PAGE_SIZE, getTotalPages } from '@/types/communityList';

const SEARCH_DEBOUNCE_MS = 300;

type UsePaginatedEmsPostsOptions<T> = {
  postTypes: EmsCommunityPostType[];
  categorySlug?: string;
  mapRow: (row: EmsCommunityPostRow) => T;
  sortOptions?: CommunitySortOption[];
  enableBest?: boolean;
  useDailyBestRpc?: boolean;
  enabled?: boolean;
};

export function usePaginatedEmsPosts<T>({
  postTypes,
  categorySlug,
  mapRow,
  sortOptions,
  enableBest = false,
  useDailyBestRpc = false,
  enabled = true,
}: UsePaginatedEmsPostsOptions<T>) {
  const [sort, setSort] = useState<CommunityListSort>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [jobType, setJobType] = useState<CommunityJobTypeFilter>('all');

  const [items, setItems] = useState<T[]>([]);
  const [bestItems, setBestItems] = useState<T[]>([]);
  const bestIdsRef = useRef<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const mapRowRef = useRef(mapRow);
  mapRowRef.current = mapRow;

  const postTypesRef = useRef(postTypes);
  postTypesRef.current = postTypes;
  const postTypesKey = postTypes.join(',');

  const availableSortOptions = useMemo(() => sortOptions ?? [], [sortOptions]);
  const totalPages = getTotalPages(totalCount, COMMUNITY_LIST_PAGE_SIZE);
  const hasMultiplePages = totalCount > COMMUNITY_LIST_PAGE_SIZE;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadBestIds = useCallback(async (): Promise<string[]> => {
    if (!enableBest) {
      setBestItems([]);
      bestIdsRef.current = [];
      return [];
    }

    const rows = useDailyBestRpc
      ? await fetchDailyBestBambooPosts()
      : await fetchCommunitySpotlightPosts({
          postTypes: postTypesRef.current,
          categorySlug,
        });

    const mapped = rows.map((row) => mapRowRef.current(row));
    const ids = rows.map((row) => row.id);
    setBestItems(mapped);
    bestIdsRef.current = ids;
    return ids;
  }, [categorySlug, enableBest, useDailyBestRpc]);

  const fetchPage = useCallback(
    async (pageNum: number, excludeIds: string[]) => {
      const requestId = ++requestIdRef.current;
      const safePageNum = Math.max(pageNum, 1);
      const types = postTypesRef.current;

      const baseQuery = {
        postTypes: types,
        categorySlug,
        jobType: types.some((t) => t === 'job_hire' || t === 'job_seek') ? jobType : undefined,
        sort,
        search: debouncedSearch,
        pageSize: COMMUNITY_LIST_PAGE_SIZE,
        excludeIds: enableBest ? excludeIds : undefined,
      };

      setLoading(true);
      setCurrentPage(safePageNum);

      try {
        let { rows, totalCount: count } = await fetchEmsCommunityPostsPage({
          ...baseQuery,
          page: safePageNum,
        });

        if (requestId !== requestIdRef.current) return;

        const nextTotalPages = getTotalPages(count, COMMUNITY_LIST_PAGE_SIZE);
        const resolvedPage = Math.min(safePageNum, Math.max(nextTotalPages, 1));

        if (resolvedPage !== safePageNum && count > 0) {
          const retried = await fetchEmsCommunityPostsPage({
            ...baseQuery,
            page: resolvedPage,
          });
          if (requestId !== requestIdRef.current) return;
          rows = retried.rows;
          count = retried.totalCount;
        }

        setTotalCount(Math.max(0, count));
        setCurrentPage(resolvedPage);
        setItems(rows.map((row) => mapRowRef.current(row)));
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : '게시글을 불러오지 못했습니다.');
        setItems([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [categorySlug, debouncedSearch, enableBest, jobType, sort],
  );

  const goToPage = useCallback(
    async (pageNum: number) => {
      if (!enabled) return;

      const maxPage = Math.max(getTotalPages(totalCount, COMMUNITY_LIST_PAGE_SIZE), 1);
      if (pageNum < 1 || pageNum > maxPage) return;
      if (pageNum === currentPage) return;

      const excludeIds = enableBest ? bestIdsRef.current : [];
      await fetchPage(pageNum, excludeIds);
    },
    [currentPage, enabled, enableBest, fetchPage, totalCount],
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setCurrentPage(1);
    const excludeIds = enableBest ? await loadBestIds() : [];
    await fetchPage(1, excludeIds);
  }, [enabled, enableBest, fetchPage, loadBestIds]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setCurrentPage(1);
      const excludeIds = enableBest ? await loadBestIds() : [];
      if (cancelled) return;
      await fetchPage(1, excludeIds);
    })();

    return () => {
      cancelled = true;
      requestIdRef.current += 1;
    };
  }, [
    categorySlug,
    debouncedSearch,
    enableBest,
    enabled,
    fetchPage,
    jobType,
    loadBestIds,
    postTypesKey,
    sort,
  ]);

  return {
    sort,
    setSort,
    searchInput,
    setSearchInput,
    debouncedSearch,
    jobType,
    setJobType,
    items,
    bestItems,
    currentPage,
    totalCount,
    totalPages,
    hasMultiplePages,
    loading,
    error,
    goToPage,
    refresh,
    sortOptions: availableSortOptions,
  };
}
