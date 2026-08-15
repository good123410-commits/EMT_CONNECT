import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { searchLocalShelters } from '@/services/shelterStore';

const SHELTER_STALE_MS = 1000 * 60 * 30;
const SHELTER_GC_MS = 1000 * 60 * 60 * 2;

export function buildShelterMarkerQueryKey(params: FacilitySearchParams) {
  return [
    'shelter-markers',
    params.mode,
    params.textQuery,
    params.regionFilter?.stage1 ?? '',
    params.regionFilter?.stage2 ?? '',
    Number(params.coordinate.latitude.toFixed(4)),
    Number(params.coordinate.longitude.toFixed(4)),
  ] as const;
}

export function useShelterMarkersQuery(params: FacilitySearchParams, enabled = true) {
  const queryKey = useMemo(() => buildShelterMarkerQueryKey(params), [params]);

  return useQuery({
    queryKey,
    queryFn: () =>
      searchLocalShelters(params.textQuery, params.coordinate, {
        regionFilter: params.regionFilter,
        limit: 100,
        radiusMeters: 20_000,
      }),
    enabled,
    staleTime: SHELTER_STALE_MS,
    gcTime: SHELTER_GC_MS,
    placeholderData: (previous) => previous,
    refetchOnMount: false,
  });
}
