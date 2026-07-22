import type { EmergencyMapPoint } from '@/components/map/EmergencyMapView.types';
import type {
  HospitalMarkerShell,
  PharmacyMarkerShell,
} from '@/services/emergencyApi';
import type { LocalAedMarker } from '@/types/localAed';
import type { LocalHospitalMarker, LocalPharmacyMarker } from '@/types/localFacility';
import { resolveFacilityLatLng } from '@/utils/facilityCoordinates';
import { isValidCoordinate } from '@/utils/mapViewport';

export function toAedMapPoints(markers: LocalAedMarker[]): EmergencyMapPoint<LocalAedMarker>[] {
  return markers
    .filter((marker) => isValidCoordinate({ latitude: marker.latitude, longitude: marker.longitude }))
    .map((marker) => ({
      id: marker.id,
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: marker.name,
      kind: 'aed' as const,
      payload: marker,
    }));
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
  return markers
    .map((marker) => {
      const coords = resolveFacilityLatLng(marker);
      if (!coords) return null;
      return {
        id: marker.i,
        latitude: coords.lat,
        longitude: coords.lng,
        name: marker.n,
        kind: 'pharmacy' as const,
        payload: { ...marker, lat: coords.lat, lng: coords.lng },
      };
    })
    .filter((point): point is EmergencyMapPoint<LocalPharmacyMarker> => {
      if (!point) return false;
      return isValidCoordinate(point);
    });
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

export function getMapCenterFromSnapshot(snapshot: {
  coordinate: { latitude: number; longitude: number };
  permissionGranted: boolean;
}) {
  if (!snapshot.permissionGranted) return undefined;
  return snapshot.coordinate;
}
