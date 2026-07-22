import aedData from '@/data/aed_data.json';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
} from '@/services/emergencyApi';
import { normalizeFacilityName } from '@/services/localFacilityStore';
import { matchesFacilityRegion } from '@/services/facilityRegionFilter';
import type { GeoCoordinate } from '@/services/locationService';
import type {
  LocalAedMarker,
  LocalAedRecord,
  LocalAedSearchOptions,
} from '@/types/localAed';
import { resolveFacilityLatLng } from '@/utils/facilityCoordinates';

const AED_RECORDS = aedData as LocalAedRecord[];

type IndexedAed = LocalAedRecord & {
  id: string;
  searchKey: string;
};

let aedIndex: IndexedAed[] | null = null;

function buildSearchKey(name: string, address: string, location: string): string {
  return `${normalizeFacilityName(name)} ${normalizeFacilityName(address)} ${normalizeFacilityName(location)}`;
}

function buildAedId(item: LocalAedRecord, index: number): string {
  return `aed_${index}_${item.latitude.toFixed(5)}_${item.longitude.toFixed(5)}`;
}

function normalizeAedRecord(item: LocalAedRecord, index: number): IndexedAed | null {
  const coords = resolveFacilityLatLng({
    latitude: item.latitude,
    longitude: item.longitude,
  });
  if (!coords) return null;

  return {
    ...item,
    latitude: coords.lat,
    longitude: coords.lng,
    id: buildAedId({ ...item, latitude: coords.lat, longitude: coords.lng }, index),
    searchKey: buildSearchKey(item.name, item.address, item.location),
  };
}

function getAedIndex(): IndexedAed[] {
  if (!aedIndex) {
    aedIndex = AED_RECORDS.map((item, index) => normalizeAedRecord(item, index)).filter(
      (item): item is IndexedAed => item !== null,
    );
  }
  return aedIndex;
}

function withDistance(items: IndexedAed[], coordinate: GeoCoordinate): LocalAedMarker[] {
  return items
    .map((item) => {
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return {
        ...item,
        distanceM,
        walkMin: estimateWalkMinutes(distanceM),
      };
    })
    .sort((a, b) => a.distanceM - b.distanceM);
}

function filterByQuery(items: IndexedAed[], query: string): IndexedAed[] {
  const q = normalizeFacilityName(query);
  if (!q) return items;

  return items.filter((item) => {
    if (item.searchKey.includes(q)) return true;
    return (
      normalizeFacilityName(item.name).includes(q) ||
      normalizeFacilityName(item.address).includes(q) ||
      normalizeFacilityName(item.location).includes(q)
    );
  });
}

export function getLocalAedRecords(): LocalAedRecord[] {
  return AED_RECORDS;
}

export function searchLocalAeds(
  query: string,
  coordinate: GeoCoordinate,
  options: LocalAedSearchOptions = {},
): LocalAedMarker[] {
  const limit = options.limit ?? 80;
  const radiusMeters = options.radiusMeters ?? 5_000;
  const useGpsRadius = !options.regionFilter?.stage1 && !query.trim();

  let items = getAedIndex();
  if (options.regionFilter?.stage1) {
    items = items.filter((item) =>
      matchesFacilityRegion(item.address ?? '', '', options.regionFilter!),
    );
  }
  items = filterByQuery(items, query);

  const ranked = withDistance(items, coordinate);

  if (useGpsRadius) {
    return ranked.filter((item) => item.distanceM <= radiusMeters).slice(0, limit);
  }

  return ranked.slice(0, limit);
}

export function findLocalAedById(id: string): LocalAedMarker | undefined {
  const item = getAedIndex().find((record) => record.id === id);
  if (!item) return undefined;

  return {
    ...item,
    distanceM: 0,
    walkMin: 0,
  };
}
