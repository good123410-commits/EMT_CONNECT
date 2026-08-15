import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import {
  buildFacilityMarkerQueryKey,
  searchFacilityMarkers,
  type FacilityMarkerKind,
} from '@/services/facilityMarkerService';
import type { UnifiedFacilitySearchOptions } from '@/services/facilitySearchService';

const FACILITY_STALE_MS = 1000 * 60 * 15;
const FACILITY_GC_MS = 1000 * 60 * 60;

export function useFacilityMarkersQuery(
  kind: FacilityMarkerKind,
  params: FacilitySearchParams,
  options?: UnifiedFacilitySearchOptions,
  enabled = true,
) {
  const queryKey = useMemo(
    () => buildFacilityMarkerQueryKey(kind, params, options),
    [kind, params, options],
  );

  return useQuery({
    queryKey,
    queryFn: () => searchFacilityMarkers(kind, params, options),
    enabled,
    staleTime: FACILITY_STALE_MS,
    gcTime: FACILITY_GC_MS,
    placeholderData: (previous) => previous,
    refetchOnMount: false,
  });
}

/** 탭·지역 전환 시 즉시 표시 — 해당 시설 종류만 선캐시 */
export function usePrefetchFacilityMarkers(
  params: FacilitySearchParams,
  kind: FacilityMarkerKind,
  enabled = true,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const queryKey = buildFacilityMarkerQueryKey(kind, params);
    const cached = queryClient.getQueryData(queryKey);
    if (cached) return;

    void queryClient.prefetchQuery({
      queryKey,
      queryFn: () => searchFacilityMarkers(kind, params),
      staleTime: FACILITY_STALE_MS,
    });
  }, [enabled, kind, params, queryClient]);
}
