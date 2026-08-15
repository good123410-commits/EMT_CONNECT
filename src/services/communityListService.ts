import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '@/lib/supabaseClient';
import {
  EMS_COMMUNITY_POSTS_TABLE,
  type EmsCommunityPostRow,
  type EmsCommunityPostType,
} from '@/services/emsCommunityService';
import type { CommunityListQuery } from '@/types/communityList';
import { COMMUNITY_BEST_LIMIT, COMMUNITY_LIST_PAGE_SIZE } from '@/types/communityList';

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

type PostsFilterBuilder = PostgrestFilterBuilder<
  Record<string, unknown>,
  EmsCommunityPostRow,
  unknown,
  unknown
>;

function getSelectShape(categorySlug?: string): string {
  return categorySlug
    ? '*, kemix_community_categories!inner(id, slug, name)'
    : '*';
}

function applyExcludeIds(builder: PostsFilterBuilder, excludeIds?: string[]): PostsFilterBuilder {
  if (!excludeIds?.length) return builder;

  // BEST 영역과 중복 방지 — 소량 ID는 neq 체인이 PostgREST in 구문보다 안정적
  return excludeIds.reduce((next, id) => next.neq('id', id), builder);
}

function applySharedFilters(
  builder: PostsFilterBuilder,
  query: CommunityListQuery,
): PostsFilterBuilder {
  let next = builder.eq('is_hidden', false);

  if (query.jobType === 'hire') {
    next = next.eq('post_type', 'job_hire');
  } else if (query.jobType === 'seek') {
    next = next.eq('post_type', 'job_seek');
  } else if (query.postTypes.length === 1) {
    next = next.eq('post_type', query.postTypes[0]);
  } else {
    next = next.in('post_type', query.postTypes);
  }

  if (query.categorySlug) {
    next = next.eq('kemix_community_categories.slug', query.categorySlug);
  }

  if (query.sort === 'unanswered') {
    next = next.eq('comment_count', 0);
  }

  const trimmed = query.search.trim();
  if (trimmed) {
    const pattern = `%${escapeIlike(trimmed)}%`;
    next = next.or(`title.ilike.${pattern},content.ilike.${pattern},summary.ilike.${pattern}`);
  }

  return applyExcludeIds(next, query.excludeIds);
}

function applySort(
  builder: PostsFilterBuilder,
  sort: CommunityListQuery['sort'],
  postTypes: EmsCommunityPostType[],
): PostsFilterBuilder {
  if (sort === 'unanswered') {
    return builder.order('created_at', { ascending: false });
  }
  if (sort === 'popular') {
    return builder.order('likes', { ascending: false }).order('created_at', { ascending: false });
  }
  if (postTypes.includes('bamboo')) {
    return builder.order('is_notice', { ascending: false }).order('created_at', { ascending: false });
  }
  return builder.order('created_at', { ascending: false });
}

function resolveTotalCount(
  exactCount: number | null | undefined,
  rowCount: number,
  page: number,
  pageSize: number,
): number {
  if (typeof exactCount === 'number' && Number.isFinite(exactCount) && exactCount >= 0) {
    return exactCount;
  }

  if (__DEV__) {
    console.warn('[communityList] count: exact total missing — applying fallback estimate', {
      exactCount,
      rowCount,
      page,
      pageSize,
    });
  }

  if (rowCount < pageSize) {
    return (page - 1) * pageSize + rowCount;
  }

  return page * pageSize + 1;
}

/**
 * `ems_community_posts` 페이지네이션 조회 — count + range 단일 쿼리.
 */
export async function fetchEmsCommunityPostsPage(
  query: CommunityListQuery,
): Promise<{ rows: EmsCommunityPostRow[]; totalCount: number }> {
  const page = Math.max(query.page, 1);
  const pageSize = Math.min(Math.max(query.pageSize, 1), 50);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const selectShape = getSelectShape(query.categorySlug);

  let builder = supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .select(selectShape, { count: 'exact' });

  builder = applySharedFilters(builder, query);
  builder = applySort(builder, query.sort, query.postTypes);

  const { data, error, count: exactCount } = await builder.range(from, to);

  if (error) {
    throw new Error(error.message || '게시글을 불러오지 못했습니다.');
  }

  let rows = (data ?? []) as EmsCommunityPostRow[];

  if (rows.length > pageSize) {
    if (__DEV__) {
      console.warn('[communityList] server returned more rows than pageSize; slicing client-side', {
        page,
        pageSize,
        rowCount: rows.length,
      });
    }
    rows = rows.slice(0, pageSize);
  }

  const totalCount = resolveTotalCount(exactCount, rows.length, page, pageSize);

  if (__DEV__) {
    console.log('[communityList] page fetch', {
      page,
      pageSize,
      from,
      to,
      rowCount: rows.length,
      exactCount,
      totalCount,
      postTypes: query.postTypes,
      categorySlug: query.categorySlug,
      excludeCount: query.excludeIds?.length ?? 0,
    });
  }

  return { rows, totalCount };
}

export type SpotlightQuery = {
  postTypes: EmsCommunityPostType[];
  categorySlug?: string;
  limit?: number;
};

/**
 * [BEST] 스포트라이트 영역용 상위 게시글 — `is_hot` 또는 높은 좋아요 우선.
 */
export async function fetchCommunitySpotlightPosts(
  options: SpotlightQuery,
): Promise<EmsCommunityPostRow[]> {
  const limit = Math.min(Math.max(options.limit ?? COMMUNITY_BEST_LIMIT, 1), 20);

  const selectShape = getSelectShape(options.categorySlug);

  let query = supabase
    .from(EMS_COMMUNITY_POSTS_TABLE)
    .select(selectShape)
    .eq('is_hidden', false)
    .or('is_hot.eq.true,likes.gte.3');

  if (options.postTypes.length === 1) {
    query = query.eq('post_type', options.postTypes[0]);
  } else {
    query = query.in('post_type', options.postTypes);
  }

  if (options.categorySlug) {
    query = query.eq('kemix_community_categories.slug', options.categorySlug);
  }

  const { data, error } = await query
    .order('is_hot', { ascending: false })
    .order('likes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as EmsCommunityPostRow[];
}

/** 질문함 일간 베스트 RPC 래퍼 (24시간 좋아요 상위) */
export async function fetchDailyBestBambooPosts(limit = COMMUNITY_BEST_LIMIT): Promise<EmsCommunityPostRow[]> {
  try {
    const { data, error } = await supabase.rpc('list_daily_best_posts', {
      p_limit: limit,
    });
    if (error || !data?.length) return [];
    return data as EmsCommunityPostRow[];
  } catch {
    return [];
  }
}

export function defaultCommunityListQuery(
  postTypes: EmsCommunityPostType[],
  overrides?: Partial<CommunityListQuery>,
): CommunityListQuery {
  return {
    postTypes,
    sort: 'latest',
    search: '',
    page: 1,
    pageSize: COMMUNITY_LIST_PAGE_SIZE,
    ...overrides,
  };
}
