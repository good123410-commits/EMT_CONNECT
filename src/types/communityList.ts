import type { EmsCommunityPostType } from '@/services/emsCommunityService';

/** 커뮤니티 리스트 정렬 — `popular`는 좋아요(`likes`) 기준 (조회수 컬럼 없음) */
export type CommunityListSort = 'latest' | 'popular' | 'unanswered';

export type CommunityJobTypeFilter = 'all' | 'hire' | 'seek';

export type CommunityListQuery = {
  postTypes: EmsCommunityPostType[];
  categorySlug?: string;
  jobType?: CommunityJobTypeFilter;
  sort: CommunityListSort;
  search: string;
  page: number;
  pageSize: number;
  excludeIds?: string[];
};

export type PaginatedEmsPostsResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CommunitySortOption = {
  value: CommunityListSort;
  label: string;
};

export const COMMUNITY_LIST_PAGE_SIZE = 10;
export const COMMUNITY_BEST_LIMIT = 5;

export function getTotalPages(totalCount: number, pageSize = COMMUNITY_LIST_PAGE_SIZE): number {
  if (totalCount <= 0) return 1;
  return Math.ceil(totalCount / pageSize);
}

export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
): number[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export const DEFAULT_COMMUNITY_SORT_OPTIONS: CommunitySortOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'unanswered', label: '답변 대기' },
];

export const CASE_STUDY_SORT_OPTIONS: CommunitySortOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];

export const JOB_SORT_OPTIONS: CommunitySortOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];

export const RESOURCE_SORT_OPTIONS: CommunitySortOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '추천순' },
];

export const CHAT_ROOM_SORT_OPTIONS: CommunitySortOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];
