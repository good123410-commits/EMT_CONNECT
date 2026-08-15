import { useEffect, useState } from 'react';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { getDefaultCoordinate, type GeoCoordinate, type LocationSnapshot } from '@/services/locationService';
import { getMapCenterFromSnapshot } from '@/utils/mapMarkers';
import { isValidCoordinate } from '@/utils/mapViewport';

type SelectedMapTarget = {
  latitude: number;
  longitude: number;
} | null;

function resolveMapCenter(
  locationSnapshot: LocationSnapshot,
  searchParams: FacilitySearchParams,
  selectedLat: number | undefined,
  selectedLng: number | undefined,
): GeoCoordinate {
  if (
    selectedLat != null &&
    selectedLng != null &&
    isValidCoordinate({ latitude: selectedLat, longitude: selectedLng })
  ) {
    return { latitude: selectedLat, longitude: selectedLng };
  }

  if (searchParams.mode === 'manual' && isValidCoordinate(searchParams.coordinate)) {
    return searchParams.coordinate;
  }

  return getMapCenterFromSnapshot(locationSnapshot);
}

/** 지도 모듈 중심 — GPS / 수동 지역 선택 / 마커 선택에 맞춰 동기화 */
export function useMapModuleCenter(
  locationSnapshot: LocationSnapshot,
  searchParams: FacilitySearchParams,
  selectedTarget: SelectedMapTarget,
) {
  const selectedLat = selectedTarget?.latitude;
  const selectedLng = selectedTarget?.longitude;

  const [mapCenter, setMapCenter] = useState<GeoCoordinate>(() =>
    resolveMapCenter(locationSnapshot, searchParams, selectedLat, selectedLng),
  );

  useEffect(() => {
    const next = resolveMapCenter(locationSnapshot, searchParams, selectedLat, selectedLng);
    setMapCenter((prev) =>
      prev.latitude === next.latitude && prev.longitude === next.longitude ? prev : next,
    );
  }, [
    locationSnapshot,
    selectedLat,
    selectedLng,
    searchParams.mode,
    searchParams.coordinate.latitude,
    searchParams.coordinate.longitude,
  ]);

  const safeSetMapCenter = (center: GeoCoordinate) => {
    if (isValidCoordinate(center)) {
      setMapCenter(center);
      return;
    }
    setMapCenter(getDefaultCoordinate());
  };

  return [mapCenter, safeSetMapCenter] as const;
}
