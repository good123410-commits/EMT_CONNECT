import hospitalData from '@/data/generated/hospital_data.json';
import pharmacyData from '@/data/generated/pharmacy_data.json';
import {
  ensureCustomHospitalDbHydrated,
  getCustomHospitalOverlay,
  getMergedBundledHospitalRecords,
  registerHospitalIndexInvalidator,
} from '@/services/customHospitalService';
import { SIDO_LIST } from '@/services/locationService';
import type {
  LocalHospitalMarker,
  LocalHospitalRecord,
  LocalPharmacyMarker,
  LocalPharmacyRecord,
  LocalSearchOptions,
} from '@/types/localFacility';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
} from '@/services/emergencyApi';
import { matchesFacilityRegion } from '@/services/facilityRegionFilter';
import type { GeoCoordinate } from '@/services/locationService';
import { isValidKoreaCoordinate, resolveFacilityLatLng } from '@/utils/facilityCoordinates';

const HOSPITALS = hospitalData as LocalHospitalRecord[];
const PHARMACIES = pharmacyData as LocalPharmacyRecord[];

type IndexedHospital = LocalHospitalRecord & {
  searchKey: string;
  lat: number;
  lng: number;
};

type IndexedPharmacy = LocalPharmacyRecord & {
  searchKey: string;
  lat: number;
  lng: number;
};

type FacilityIndex<T> = {
  all: T[];
  bySido: Map<string, T[]>;
};

let hospitalIndex: FacilityIndex<IndexedHospital> | null = null;
let pharmacyIndex: FacilityIndex<IndexedPharmacy> | null = null;

export function normalizeFacilityName(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

export function buildFacilityMatchKey(name: string, sigungu = ''): string {
  return `${normalizeFacilityName(name)}|${normalizeFacilityName(sigungu)}`;
}

function buildSearchKey(name: string, address: string, sigungu: string): string {
  return `${normalizeFacilityName(name)} ${normalizeFacilityName(address)} ${normalizeFacilityName(sigungu)}`;
}

function resolveSidoBucket(address: string): string {
  for (const sido of SIDO_LIST) {
    if (address.includes(sido)) return sido;
  }
  return address.split(/\s+/)[0] ?? '기타';
}

function normalizeRecordCoords<T extends { a: string; lat?: number; lng?: number }>(
  item: T,
): (T & { lat: number; lng: number }) | null {
  const coords = resolveFacilityLatLng(item);
  if (!coords || !isValidKoreaCoordinate(coords.lat, coords.lng)) return null;
  return { ...item, lat: coords.lat, lng: coords.lng };
}

function buildIndex<T extends { a: string; lat: number; lng: number; n: string; sg: string }>(
  records: Array<{ a: string; n: string; sg: string; lat?: number; lng?: number; p?: string }>,
): FacilityIndex<T> {
  const all: T[] = [];
  const bySido = new Map<string, T[]>();

  for (const raw of records) {
    const normalized = normalizeRecordCoords(raw);
    if (!normalized) continue;

    const item = {
      ...normalized,
      searchKey: buildSearchKey(normalized.n, normalized.a, normalized.sg),
    } as T;

    all.push(item);
    const bucket = resolveSidoBucket(normalized.a);
    const list = bySido.get(bucket) ?? [];
    list.push(item);
    bySido.set(bucket, list);
  }

  return { all, bySido };
}

function getHospitalIndex(): FacilityIndex<IndexedHospital> {
  if (!hospitalIndex) {
    hospitalIndex = buildIndex(getMergedBundledHospitalRecords());
  }
  return hospitalIndex;
}

registerHospitalIndexInvalidator(() => {
  hospitalIndex = null;
});

export function invalidateHospitalFacilityIndex(): void {
  hospitalIndex = null;
}

function getPharmacyIndex(): FacilityIndex<IndexedPharmacy> {
  if (!pharmacyIndex) {
    pharmacyIndex = buildIndex(PHARMACIES);
  }
  return pharmacyIndex;
}

function pickCandidatePool<T extends { a: string }>(
  index: FacilityIndex<T>,
  regionFilter?: { stage1: string; stage2?: string },
): T[] {
  if (!regionFilter?.stage1) return index.all;
  const bucket = index.bySido.get(regionFilter.stage1);
  if (bucket?.length) return bucket;
  return index.all.filter((item) =>
    matchesFacilityRegion(item.a ?? '', (item as { sg?: string }).sg ?? '', regionFilter),
  );
}

function filterByRoughRadius<T extends { lat: number; lng: number }>(
  items: T[],
  coordinate: GeoCoordinate,
  radiusMeters: number,
): T[] {
  const latPad = radiusMeters / 111_000;
  const lngPad = radiusMeters / (111_000 * Math.cos((coordinate.latitude * Math.PI) / 180));
  return items.filter(
    (item) =>
      Math.abs(item.lat - coordinate.latitude) <= latPad &&
      Math.abs(item.lng - coordinate.longitude) <= lngPad,
  );
}

function withDistance<T extends { lat: number; lng: number }>(
  items: T[],
  coordinate: GeoCoordinate,
  roughRadiusMeters?: number,
) {
  const candidates = roughRadiusMeters
    ? filterByRoughRadius(items, coordinate, roughRadiusMeters)
    : items;

  return candidates
    .map((item) => {
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: item.lat,
        longitude: item.lng,
      });
      return {
        ...item,
        distanceM,
        walkMin: estimateWalkMinutes(distanceM),
        distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
      };
    })
    .sort((a, b) => a.distanceM - b.distanceM);
}

function filterByQuery<T extends { searchKey: string; n: string; a?: string; p?: string }>(
  items: T[],
  query: string,
): T[] {
  const q = normalizeFacilityName(query);
  if (!q) return items;
  return items.filter(
    (item) =>
      item.searchKey.includes(q) ||
      normalizeFacilityName(item.n).includes(q) ||
      normalizeFacilityName(item.a ?? '').includes(q) ||
      normalizeFacilityName(item.p ?? '').includes(q),
  );
}

function filterByRegion<T extends { a: string; sg: string }>(
  items: T[],
  regionFilter?: { stage1: string; stage2?: string },
): T[] {
  if (!regionFilter?.stage1) return items;
  return items.filter((item) =>
    matchesFacilityRegion(item.a ?? '', item.sg ?? '', regionFilter),
  );
}

export function getLocalHospitalRecords(): LocalHospitalRecord[] {
  return HOSPITALS;
}

export function getLocalPharmacyRecords(): LocalPharmacyRecord[] {
  return PHARMACIES;
}

function attachCustomHospitalOverlay(marker: LocalHospitalMarker): LocalHospitalMarker {
  const overlay = getCustomHospitalOverlay(marker.i);
  if (!overlay) return marker;

  return {
    ...marker,
    isPartner: overlay.isPartner,
    customMemo: overlay.customMemo,
    specialties: overlay.specialties.length ? overlay.specialties : marker.specialties,
    weeklySchedule: overlay.weeklySchedule.length ? overlay.weeklySchedule : marker.weeklySchedule,
    isOpenNow: overlay.weeklySchedule.length ? overlay.isOpenNow : marker.isOpenNow,
    openStatusLabel:
      overlay.openStatusLabel !== '확인 필요' ? overlay.openStatusLabel : marker.openStatusLabel,
    hospitalType: overlay.hospitalType,
    isCustomOnly: overlay.isCustomOnly,
  };
}

export function searchLocalHospitals(
  query: string,
  coordinate: GeoCoordinate,
  options: LocalSearchOptions = {},
): LocalHospitalMarker[] {
  void ensureCustomHospitalDbHydrated();
  const limit = options.limit ?? 80;
  const radiusMeters = options.radiusMeters ?? 20_000;
  const useGpsRadius = !options.regionFilter?.stage1 && !query.trim();

  let items = pickCandidatePool(getHospitalIndex(), options.regionFilter);
  if (options.erOnly) {
    items = items.filter((item) => item.er === 1);
  }

  items = filterByRegion(items, options.regionFilter);
  items = filterByQuery(items, query);
  const ranked = withDistance(items, coordinate, useGpsRadius ? radiusMeters * 1.2 : undefined);

  if (useGpsRadius) {
    const inRadius = ranked.filter((item) => item.distanceM <= radiusMeters);
    if (inRadius.length > 0) {
      return inRadius.slice(0, limit).map(attachCustomHospitalOverlay);
    }
    return ranked.slice(0, limit).map(attachCustomHospitalOverlay);
  }

  return ranked.slice(0, limit).map(attachCustomHospitalOverlay);
}

export function searchLocalPharmacies(
  query: string,
  coordinate: GeoCoordinate,
  options: LocalSearchOptions = {},
): LocalPharmacyMarker[] {
  const limit = options.limit ?? 80;
  const radiusMeters = options.radiusMeters ?? 15_000;
  const useGpsRadius = !options.regionFilter?.stage1 && !query.trim();

  let items = pickCandidatePool(getPharmacyIndex(), options.regionFilter);
  items = filterByRegion(items, options.regionFilter);
  items = filterByQuery(items, query);
  const ranked = withDistance(items, coordinate, useGpsRadius ? radiusMeters * 1.2 : undefined);

  if (useGpsRadius) {
    const inRadius = ranked.filter((item) => item.distanceM <= radiusMeters);
    if (inRadius.length > 0) return inRadius.slice(0, limit);
    return ranked.slice(0, limit);
  }

  return ranked.slice(0, limit);
}

export function findLocalHospitalById(id: string): LocalHospitalRecord | undefined {
  const bundled = HOSPITALS.find((item) => item.i === id);
  if (bundled) return bundled;
  return getMergedBundledHospitalRecords().find((item) => item.i === id);
}

export function findLocalPharmacyById(id: string): LocalPharmacyRecord | undefined {
  return PHARMACIES.find((item) => item.i === id);
}
