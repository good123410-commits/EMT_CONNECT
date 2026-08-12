import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { useFacilityMarkersQuery } from '@/hooks/useFacilityMarkersQuery';
import {
  ensurePharmacyNightHoursLoaded,
  mergeNightHoursIntoPharmacyMarkers,
} from '@/services/pharmacyNightHoursService';
import type { LocalPharmacyMarker } from '@/types/localFacility';

const NIGHT_HOURS_STALE_MS = 1000 * 60 * 60 * 24;

export function usePharmacyMarkersQuery(params: FacilitySearchParams, enabled = true) {
  const markersQuery = useFacilityMarkersQuery('pharmacy', params, undefined, enabled);

  const nightHoursQuery = useQuery({
    queryKey: ['night-pharmacy-hours'],
    queryFn: ensurePharmacyNightHoursLoaded,
    staleTime: NIGHT_HOURS_STALE_MS,
    gcTime: NIGHT_HOURS_STALE_MS * 2,
    enabled,
    refetchOnMount: false,
  });

  const data = useMemo((): LocalPharmacyMarker[] => {
    const base = markersQuery.data ?? [];
    return mergeNightHoursIntoPharmacyMarkers(base, nightHoursQuery.data);
  }, [markersQuery.data, nightHoursQuery.data]);

  return {
    ...markersQuery,
    data,
    isNightHoursLoading: nightHoursQuery.isLoading,
  };
}
