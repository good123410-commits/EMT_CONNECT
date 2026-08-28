import { useQuery } from '@tanstack/react-query';
import { InteractionManager } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import {
  buildFacilityMarkerQueryKey,
  getFacilitySearchOptions,
  searchFacilityMarkers,
  type FacilityMarkerKind,
} from '@/services/facilityMarkerService';
import type { UnifiedFacilitySearchOptions } from '@/services/facilitySearchService';
import { deferToNextFrame } from '@/utils/mapRoughRadius';

const FACILITY_STALE_MS = 1000 * 60 * 15;
const FACILITY_GC_MS = 1000 * 60 * 60;
const EXPAND_DELAY_MS = 450;

export function useFacilityMarkersQuery(
  kind: FacilityMarkerKind,
  params: FacilitySearchParams,
  options?: UnifiedFacilitySearchOptions,
  enabled = true,
) {
  const [expandEnabled, setExpandEnabled] = useState(false);

  const initialOptions = useMemo(
    () => getFacilitySearchOptions(kind, 'initial', options),
    [kind, options],
  );
  const expandedOptions = useMemo(
    () => getFacilitySearchOptions(kind, 'expanded', options),
    [kind, options],
  );

  const initialKey = useMemo(
    () => buildFacilityMarkerQueryKey(kind, params, initialOptions, 'initial'),
    [kind, initialOptions, params],
  );
  const expandedKey = useMemo(
    () => buildFacilityMarkerQueryKey(kind, params, expandedOptions, 'expanded'),
    [expandedOptions, kind, params],
  );

  const initialQuery = useQuery({
    queryKey: initialKey,
    queryFn: async ({ signal }) => {
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });
      if (signal.aborted) return [];
      await deferToNextFrame();
      if (signal.aborted) return [];
      return searchFacilityMarkers(kind, params, initialOptions);
    },
    enabled,
    staleTime: FACILITY_STALE_MS,
    gcTime: FACILITY_GC_MS,
    placeholderData: (previous) => previous,
    refetchOnMount: false,
  });

  const expandedQuery = useQuery({
    queryKey: expandedKey,
    queryFn: async ({ signal }) => {
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });
      if (signal.aborted) return [];
      await deferToNextFrame();
      if (signal.aborted) return [];
      return searchFacilityMarkers(kind, params, expandedOptions);
    },
    enabled: enabled && expandEnabled,
    staleTime: FACILITY_STALE_MS,
    gcTime: FACILITY_GC_MS,
    placeholderData: (previous) => previous,
    refetchOnMount: false,
  });

  useEffect(() => {
    setExpandEnabled(false);
  }, [
    params.mode,
    params.textQuery,
    params.regionFilter?.stage1,
    params.regionFilter?.stage2,
    Number(params.coordinate.latitude.toFixed(3)),
    Number(params.coordinate.longitude.toFixed(3)),
    kind,
  ]);

  useEffect(() => {
    if (!enabled || expandEnabled) return;
    if (!initialQuery.isSuccess || initialQuery.isFetching) return;

    const timer = setTimeout(() => {
      setExpandEnabled(true);
    }, EXPAND_DELAY_MS);

    return () => clearTimeout(timer);
  }, [enabled, expandEnabled, initialQuery.isFetching, initialQuery.isSuccess]);

  const data = expandedQuery.data ?? initialQuery.data ?? [];
  const isInitialLoad =
    initialQuery.isLoading || (initialQuery.isFetching && !initialQuery.data?.length);

  return {
    data,
    isFetching: initialQuery.isFetching || expandedQuery.isFetching,
    isLoading: isInitialLoad,
    isInitialLoad,
    isError: initialQuery.isError || expandedQuery.isError,
    isSuccess: initialQuery.isSuccess,
    phase: expandEnabled ? ('expanded' as const) : ('initial' as const),
  };
}
