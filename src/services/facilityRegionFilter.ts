import { supabase } from '@/lib/supabaseClient';
import type { LocationRegion } from '@/services/locationService';
import {
  canonicalizeStage1,
  matchesFacilityAddressRegion,
  parseFacilityAddressRegion,
} from '@/utils/facilityAddressRegion';

export type FacilityRegionFilter = {
  stage1: string;
  stage2?: string;
};

/** Supabase 조회 시 지도·리스트에 필요한 최소 컬럼만 */
export const FACILITY_MAP_COLUMNS =
  'id,name,address,latitude,longitude,phone,sigungu,facility_type' as const;

/** 주소·시군구 필드가 선택 지역과 일치하는지 판별 */
export function matchesFacilityRegion(
  address: string,
  sigungu: string,
  filter: FacilityRegionFilter,
): boolean {
  return matchesFacilityAddressRegion(address, sigungu, filter);
}

export { canonicalizeStage1, parseFacilityAddressRegion };

export function toLocationRegion(filter: FacilityRegionFilter): LocationRegion {
  const stage2 = filter.stage2?.trim() ?? '';
  return {
    stage1: filter.stage1,
    stage2,
    label: stage2 ? `${filter.stage1} ${stage2}` : filter.stage1,
  };
}

export type SupabaseFacilityRegionQuery = {
  facilityType: 'aed' | 'hospital' | 'pharmacy';
  region: FacilityRegionFilter;
  textQuery?: string;
  limit?: number;
};

const FACILITY_TABLE_BY_TYPE: Record<SupabaseFacilityRegionQuery['facilityType'], string> = {
  aed: 'facility_aeds',
  hospital: 'facility_hospitals',
  pharmacy: 'facility_pharmacies',
};

/**
 * Supabase 지역 시설 조회 (테이블 미구축 시 빈 배열 — 로컬 JSON이 기본 데이터 소스)
 */
export async function queryFacilitiesByRegionSupabase(
  query: SupabaseFacilityRegionQuery,
): Promise<unknown[]> {
  const table = FACILITY_TABLE_BY_TYPE[query.facilityType];
  const limit = query.limit ?? 120;
  const stage1 = canonicalizeStage1(query.region.stage1.trim());
  if (!stage1) return [];

  let request = supabase
    .from(table)
    .select(FACILITY_MAP_COLUMNS)
    .ilike('address', `%${stage1}%`)
    .limit(limit);

  if (query.region.stage2?.trim()) {
    request = request.ilike('sigungu', `%${query.region.stage2.trim()}%`);
  }

  const text = query.textQuery?.trim();
  if (text) {
    request = request.or(`name.ilike.%${text}%,address.ilike.%${text}%`);
  }

  const { data, error } = await request;
  if (error) {
    if (__DEV__) {
      console.warn('[facilityRegionFilter] Supabase query skipped:', error.message);
    }
    return [];
  }

  return data ?? [];
}
