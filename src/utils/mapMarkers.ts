import type { EmergencyMapPoint } from '@/components/map/EmergencyMapView.types';
import type {
  HospitalMarkerShell,
  PharmacyMarkerShell,
} from '@/services/emergencyApi';
import type { LocalAedMarker } from '@/types/localAed';
import type { LocalShelterMarker } from '@/types/shelter';
import type { LocalHospitalMarker, LocalPharmacyMarker } from '@/types/localFacility';
import { getDefaultCoordinate } from '@/services/locationService';
import { limitMapMarkers } from '@/utils/mapMarkerDisplayLimit';
import { isValidCoordinate } from '@/utils/mapViewport';

export function toAedMapPoints(markers: LocalAedMarker[]): EmergencyMapPoint<LocalAedMarker>[] {
  try {
    const safeMarkers = Array.isArray(markers) ? markers : [];
    const points = safeMarkers
      .filter((marker) =>
        isValidCoordinate({ latitude: marker.latitude, longitude: marker.longitude }),
      )
      .map((marker) => ({
        id: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        name: marker.name ?? 'AED',
        kind: 'aed' as const,
        payload: marker,
      }));
    return limitMapMarkers(points);
  } catch (error) {
    if (__DEV__) {
      console.warn('[mapMarkers] AED map points failed', error);
    }
    return [];
  }
}

export function toLocalHospitalMapPoints(
  markers: LocalHospitalMarker[],
): EmergencyMapPoint<LocalHospitalMarker>[] {
  return markers
    .filter((marker) => isValidCoordinate({ latitude: marker.lat, longitude: marker.lng }))
    .map((marker) => ({
      id: marker.i,
      latitude: marker.lat,
      longitude: marker.lng,
      name: marker.n,
      kind: 'er' as const,
      payload: marker,
    }));
}

export function toLocalPharmacyMapPoints(
  markers: LocalPharmacyMarker[],
): EmergencyMapPoint<LocalPharmacyMarker>[] {
  try {
    const safeMarkers = Array.isArray(markers) ? markers : [];
    const points = safeMarkers
      .map((marker) => {
        const lat = marker.lat;
        const lng = marker.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        if (!isValidCoordinate({ latitude: lat, longitude: lng })) return null;
        return {
          id: marker.i ?? `${lat}-${lng}`,
          latitude: lat,
          longitude: lng,
          name: marker.n ?? '약국',
          kind: 'pharmacy' as const,
          payload: marker,
        };
      })
      .filter((point): point is EmergencyMapPoint<LocalPharmacyMarker> => point !== null);
    return limitMapMarkers(points);
  } catch (error) {
    if (__DEV__) {
      console.warn('[mapMarkers] pharmacy map points failed', error);
    }
    return [];
  }
}

export function toHospitalMapPoints(
  markers: HospitalMarkerShell[],
): EmergencyMapPoint<HospitalMarkerShell>[] {
  return markers
    .filter((marker) => isValidCoordinate(marker))
    .map((marker) => ({
      id: marker.hpid,
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: marker.name,
      kind: 'er' as const,
      payload: marker,
    }));
}

export function toPharmacyMapPoints(
  markers: PharmacyMarkerShell[],
): EmergencyMapPoint<PharmacyMarkerShell>[] {
  return markers
    .filter((marker) => isValidCoordinate(marker))
    .map((marker) => ({
      id: marker.hpid,
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: marker.name,
      kind: 'pharmacy' as const,
      payload: marker,
    }));
}

export function toPediatricHospitalMapPoints(
  markers: import('@/services/hospitalFinderService').HospitalFinderItem[],
): EmergencyMapPoint<import('@/services/hospitalFinderService').HospitalFinderItem>[] {
  return markers
    .filter((marker) => isValidCoordinate({ latitude: marker.latitude, longitude: marker.longitude }))
    .map((marker) => ({
      id: marker.hpid,
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: marker.name,
      kind: 'pediatric' as const,
      payload: marker,
    }));
}

export function toShelterMapPoints(
  markers: LocalShelterMarker[],
): EmergencyMapPoint<LocalShelterMarker>[] {
  return markers
    .filter((marker) => isValidCoordinate(marker))
    .map((marker) => ({
      id: marker.id,
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: marker.name,
      kind: 'shelter' as const,
      payload: marker,
    }));
}

export function getMapCenterFromSnapshot(snapshot: {
  coordinate: { latitude: number; longitude: number };
  permissionGranted: boolean;
}) {
  if (isValidCoordinate(snapshot.coordinate)) {
    return snapshot.coordinate;
  }
  return getDefaultCoordinate();
}

export function buildMapViewKey(prefix: string, center: { latitude: number; longitude: number } | undefined) {
  if (!center || !isValidCoordinate(center)) {
    return `${prefix}-default`;
  }
  return `${prefix}-${center.latitude.toFixed(4)}-${center.longitude.toFixed(4)}`;
}
