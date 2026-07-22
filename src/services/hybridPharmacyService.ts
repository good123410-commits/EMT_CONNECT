import {
  findLocalPharmacyById,
  searchLocalPharmacies,
} from '@/services/localFacilityStore';
import type { GeoCoordinate } from '@/services/locationService';
import type { LocalPharmacyMarker, LocalPharmacyRecord } from '@/types/localFacility';
import { getPharmacyOpenStatus } from '@/utils/pharmacyHours';

export type HybridPharmacyMarker = {
  hpid: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  walkMin: number;
  distanceKm: number;
  address: string;
  phone: string;
};

export type HybridPharmacyDetail = {
  hpid: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  walkMin: number;
  distanceKm: number;
  isOpenNow: boolean;
  treatmentDayLabel: string;
  dutyTimeStart: string;
  dutyTimeEnd: string;
};

export function searchLocalPharmacyMarkers(
  query: string,
  coordinate: GeoCoordinate,
  options?: import('@/types/localFacility').LocalSearchOptions,
): LocalPharmacyMarker[] {
  return searchLocalPharmacies(query, coordinate, options);
}

/** @deprecated mapMarkers 호환용 — 신규 코드는 LocalPharmacyMarker 직접 사용 */
export function searchHybridPharmacies(
  query: string,
  coordinate: GeoCoordinate,
  options?: { limit?: number; radiusMeters?: number },
): HybridPharmacyMarker[] {
  return searchLocalPharmacies(query, coordinate, options).map(toHybridPharmacyMarker);
}

function toHybridPharmacyMarker(item: LocalPharmacyMarker): HybridPharmacyMarker {
  return {
    hpid: item.i,
    name: item.n,
    latitude: item.lat,
    longitude: item.lng,
    distanceM: item.distanceM,
    walkMin: item.walkMin,
    distanceKm: item.distanceKm,
    address: item.a,
    phone: item.p,
  };
}

function buildPharmacyDetailFields(record: Pick<LocalPharmacyRecord, 'wh'>) {
  const status = getPharmacyOpenStatus(record);
  return {
    isOpenNow: status.isOpenNow,
    treatmentDayLabel: status.dayLabel,
    dutyTimeStart: status.start || '-',
    dutyTimeEnd: status.end || '-',
  };
}

export function buildHybridPharmacyDetail(
  marker: HybridPharmacyMarker,
  record?: Pick<LocalPharmacyRecord, 'wh'>,
): HybridPharmacyDetail {
  const hours = buildPharmacyDetailFields(record ?? {});
  return {
    hpid: marker.hpid,
    name: marker.name,
    address: marker.address,
    phone: marker.phone || '-',
    latitude: marker.latitude,
    longitude: marker.longitude,
    distanceM: marker.distanceM,
    walkMin: marker.walkMin,
    distanceKm: marker.distanceKm,
    ...hours,
  };
}

export function getHybridPharmacyDetailFromStore(hpid: string): HybridPharmacyDetail | null {
  const local = findLocalPharmacyById(hpid);
  if (!local) return null;

  const hours = buildPharmacyDetailFields(local);

  return {
    hpid: local.i,
    name: local.n,
    address: local.a,
    phone: local.p || '-',
    latitude: local.lat,
    longitude: local.lng,
    distanceM: 0,
    walkMin: 0,
    distanceKm: 0,
    ...hours,
  };
}
