import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { mergeCustomHospitalsIntoPediatricList } from '@/services/customHospitalService';
import {
  fetchPediatricHospitals,
  sortPediatricHospitals,
  type PediatricHospitalSearchResult,
} from '@/services/hospitalFinderService';
import {
  buildPediatricLocalRegion,
  loadPediatricLocalHospitalsForSearch,
  mergePediatricHospitalResults,
} from '@/services/pediatricLocalHospitalStore';
import type { LocationRegion } from '@/services/locationService';

const PEDIATRIC_STALE_MS = 1000 * 60 * 10;
const PEDIATRIC_GC_MS = 1000 * 60 * 45;

function buildRegionFromParams(params: FacilitySearchParams): LocationRegion | undefined {
  if (!params.regionFilter?.stage1) return undefined;
  const stage1 = params.regionFilter.stage1;
  const stage2 = params.regionFilter.stage2 ?? '';
  return {
    stage1,
    stage2,
    label: stage2 ? `${stage1} ${stage2}` : stage1,
  };
}

function buildLocalPediatricResult(params: FacilitySearchParams): PediatricHospitalSearchResult {
  const region = buildRegionFromParams(params) ?? buildPediatricLocalRegion(params.regionFilter);
  const localItems = loadPediatricLocalHospitalsForSearch({
    coordinate: params.coordinate,
    regionFilter: params.regionFilter,
    mode: params.mode,
  });
  const mergedCustom = mergeCustomHospitalsIntoPediatricList(
    localItems,
    params.coordinate,
    params.regionFilter
      ? { stage1: params.regionFilter.stage1, stage2: params.regionFilter.stage2 }
      : undefined,
  );
  const sorted =
    params.mode === 'gps'
      ? [...mergedCustom].sort((a, b) => a.distanceM - b.distanceM)
      : sortPediatricHospitals(mergedCustom);

  return {
    success: true,
    items: sorted,
    region,
    requestedRegion: region,
    localSource: true,
    apiEnriched: false,
    allTreatmentsEnded: sorted.length === 0,
  };
}

export function buildPediatricHospitalsQueryKey(params: FacilitySearchParams) {
  return [
    'pediatric-hospitals',
    params.mode,
    params.regionFilter?.stage1 ?? '',
    params.regionFilter?.stage2 ?? '',
    Number(params.coordinate.latitude.toFixed(4)),
    Number(params.coordinate.longitude.toFixed(4)),
  ] as const;
}

export function usePediatricHospitalsQuery(params: FacilitySearchParams, enabled = true) {
  const region = useMemo(() => buildRegionFromParams(params), [params.regionFilter]);
  const localSnapshot = useMemo(() => buildLocalPediatricResult(params), [params]);

  return useQuery({
    queryKey: buildPediatricHospitalsQueryKey(params),
    queryFn: async (): Promise<PediatricHospitalSearchResult> => {
      const localBase = loadPediatricLocalHospitalsForSearch({
        coordinate: params.coordinate,
        regionFilter: params.regionFilter,
        mode: params.mode,
      });

      let apiResult: PediatricHospitalSearchResult | null = null;
      try {
        apiResult = await fetchPediatricHospitals({
          coordinate: params.coordinate,
          region,
        });
      } catch (error) {
        if (__DEV__) {
          console.warn('[PediatricHospitals] API enrich skipped', error);
        }
      }

      const apiItems = apiResult?.success ? apiResult.items : [];
      const merged = mergePediatricHospitalResults(localBase, apiItems);
      const withCustom = mergeCustomHospitalsIntoPediatricList(
        merged,
        params.coordinate,
        params.regionFilter
          ? { stage1: params.regionFilter.stage1, stage2: params.regionFilter.stage2 }
          : undefined,
      );

      const sorted =
        params.mode === 'gps'
          ? [...withCustom].sort((a, b) => a.distanceM - b.distanceM)
          : sortPediatricHospitals(withCustom);

      const resolvedRegion = apiResult?.region ?? localSnapshot.region;
      const requestedRegion = apiResult?.requestedRegion ?? localSnapshot.requestedRegion;

      return {
        success: true,
        items: sorted,
        region: resolvedRegion,
        requestedRegion,
        fallbackUsed: apiResult?.fallbackUsed,
        allTreatmentsEnded: sorted.length === 0,
        timedOut: apiResult?.timedOut,
        timeoutCount: apiResult?.timeoutCount,
        localSource: true,
        apiEnriched: apiResult?.success ?? false,
      };
    },
    enabled,
    initialData: localSnapshot,
    staleTime: PEDIATRIC_STALE_MS,
    gcTime: PEDIATRIC_GC_MS,
    placeholderData: (previous) => previous ?? localSnapshot,
    refetchOnMount: false,
  });
}
