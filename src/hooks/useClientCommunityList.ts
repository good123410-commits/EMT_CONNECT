import { useEffect, useMemo, useState } from 'react';
import type { CommunityListSort, CommunitySortOption } from '@/types/communityList';
import { COMMUNITY_LIST_PAGE_SIZE, getTotalPages } from '@/types/communityList';

const SEARCH_DEBOUNCE_MS = 300;

type SearchableItem = {
  id: string;
};

type UseClientCommunityListOptions<T extends SearchableItem> = {
  data: T[];
  sortOptions: CommunitySortOption[];
  searchText: (item: T) => string;
  sortCompare: (a: T, b: T, sort: CommunityListSort) => number;
  pickBest?: (items: T[]) => T[];
  enabled?: boolean;
};

export function useClientCommunityList<T extends SearchableItem>({
  data,
  sortOptions,
  searchText,
  sortCompare,
  pickBest,
  enabled = true,
}: UseClientCommunityListOptions<T>) {
  const [sort, setSort] = useState<CommunityListSort>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sort, data]);

  const bestItems = useMemo(() => {
    if (!enabled || !pickBest) return [] as T[];
    return pickBest(data);
  }, [data, enabled, pickBest]);

  const bestIdSet = useMemo(() => new Set(bestItems.map((item) => item.id)), [bestItems]);

  const filteredSorted = useMemo(() => {
    if (!enabled) return [] as T[];

    const keyword = debouncedSearch.toLowerCase();
    let rows = data.filter((item) => !bestIdSet.has(item.id));

    if (keyword) {
      rows = rows.filter((item) => searchText(item).toLowerCase().includes(keyword));
    }

    return [...rows].sort((a, b) => sortCompare(a, b, sort));
  }, [bestIdSet, data, debouncedSearch, enabled, searchText, sort, sortCompare]);

  const totalCount = filteredSorted.length;
  const totalPages = getTotalPages(totalCount, COMMUNITY_LIST_PAGE_SIZE);
  const safePage = Math.min(currentPage, totalPages);

  const items = useMemo(() => {
    const start = (safePage - 1) * COMMUNITY_LIST_PAGE_SIZE;
    return filteredSorted.slice(start, start + COMMUNITY_LIST_PAGE_SIZE);
  }, [filteredSorted, safePage]);

  const hasMultiplePages = totalPages > 1;

  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages || pageNum === safePage) return;
    setCurrentPage(pageNum);
  };

  return {
    sort,
    setSort,
    searchInput,
    setSearchInput,
    debouncedSearch,
    items,
    bestItems,
    currentPage: safePage,
    totalCount,
    totalPages,
    hasMultiplePages,
    goToPage,
    sortOptions,
  };
}
