import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { searchLocalShelters } from '@/services/shelterStore';
import { deferToNextFrame } from '@/utils/mapRoughRadius';

const SHELTER_STALE_MS = 1000 * 60 * 30;
const SHELTER_GC_MS = 1000 * 60 * 60 * 2;
const SHELTER_INITIAL_RADIUS = 3_000;
const SHELTER_EXPANDED_RADIUS = 20_000;

export function buildShelterMarkerQueryKey(
  params: FacilitySearchParams,
  radiusMeters: number,
) {
  return [
    'shelter-markers',
    params.mode,
    params.textQuery,
    params.regionFilter?.stage1 ?? '',
    params.regionFilter?.stage2 ?? '',
    Number(params.coordinate.latitude.toFixed(4)),
    Number(params.coordinate.longitude.toFixed(4)),
    radiusMeters,
  ] as const;
}

export function useShelterMarkersQuery(params: FacilitySearchParams, enabled = true) {
  const initialKey = useMemo(
    () => buildShelterMarkerQueryKey(params, SHELTER_INITIAL_RADIUS),
    [params],
  );
  const expandedKey = useMemo(
    () => buildShelterMarkerQueryKey(params, SHELTER_EXPANDED_RADIUS),
    [params],
  );

  const initialQuery = useQuery({
    queryKey: initialKey,
    queryFn: async () => {
      await deferToNextFrame();
      return searchLocalShelters(params.textQuery, params.coordinate, {
        regionFilter: params.regionFilter,
        limit: 40,
        radiusMeters: SHELTER_INITIAL_RADIUS,
      });
    },
    enabled,
    staleTime: SHELTER_STALE_MS,
    gcTime: SHELTER_GC_MS,
    placeholderData: (previous) => previous,
    refetchOnMount: false,
  });

  const expandedQuery = useQuery({
    queryKey: expandedKey,
    queryFn: async () => {
      await deferToNextFrame();
      return searchLocalShelters(params.textQuery, params.coordinate, {
        regionFilter: params.regionFilter,
        limit: 100,
        radiusMeters: SHELTER_EXPANDED_RADIUS,
      });
    },
    enabled: enabled && initialQuery.isSuccess,
    staleTime: SHELTER_STALE_MS,
    gcTime: SHELTER_GC_MS,
    placeholderData: (previous) => previous,
    refetchOnMount: false,
  });

  const data = expandedQuery.data ?? initialQuery.data ?? [];
  const isInitialLoad =
    initialQuery.isLoading || (initialQuery.isFetching && !initialQuery.data?.length);

  return {
    data,
    isFetching: initialQuery.isFetching || expandedQuery.isFetching,
    isLoading: isInitialLoad,
    isInitialLoad,
    isError: initialQuery.isError || expandedQuery.isError,
  };
}
