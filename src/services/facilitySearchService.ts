import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { queryFacilitiesByRegionSupabase } from '@/services/facilityRegionFilter';

export type FacilityKind = 'aed' | 'hospital' | 'pharmacy';

export type UnifiedFacilitySearchOptions = {
  limit?: number;
  radiusMeters?: number;
  erOnly?: boolean;
};

/**
 * 로컬 JSON 검색 옵션으로 변환 + Supabase 지역 쿼리 훅 포인트
 */
export function buildLocalSearchOptions(
  params: FacilitySearchParams,
  defaults: UnifiedFacilitySearchOptions = {},
) {
  const isGps = params.mode === 'gps' && !params.textQuery;

  return {
    limit: defaults.limit,
    radiusMeters: isGps ? defaults.radiusMeters : undefined,
    erOnly: defaults.erOnly,
    regionFilter: params.mode === 'manual' ? params.regionFilter : undefined,
  };
}

/** Supabase 연동 시 수동 지역 검색 대체/보강용 */
export async function prefetchRegionFacilitiesFromSupabase(
  facilityType: FacilityKind,
  params: FacilitySearchParams,
): Promise<void> {
  if (params.mode !== 'manual' || !params.regionFilter?.stage1) return;

  await queryFacilitiesByRegionSupabase({
    facilityType,
    region: params.regionFilter,
    textQuery: params.textQuery,
  });
}
