import { InteractionManager } from 'react-native';
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
import { filterCoordinatesByFacilityRegion } from '@/utils/facilityCoordinateRegion';
import { resolveFacilityLatLng } from '@/utils/facilityCoordinates';
import { filterByRoughRadius } from '@/utils/mapRoughRadius';

const AED_RECORDS = aedData as LocalAedRecord[];

/** 위·경도 격자 셀 크기(도) — 약 5.5km */
const AED_GRID_CELL = 0.05;

type IndexedAed = LocalAedRecord & {
  id: string;
  searchKey: string;
};

type AedSpatialGrid = Map<string, LocalAedRecord[]>;

let aedIndex: IndexedAed[] | null = null;
let aedSpatialGrid: AedSpatialGrid | null = null;
let indexWarmScheduled = false;

function aedGridKey(lat: number, lng: number): string {
  return `${Math.floor(lat / AED_GRID_CELL)}:${Math.floor(lng / AED_GRID_CELL)}`;
}

function buildAedSpatialGrid(): AedSpatialGrid {
  const grid: AedSpatialGrid = new Map();
  for (let index = 0; index < AED_RECORDS.length; index += 1) {
    const record = AED_RECORDS[index];
    const coords = resolveFacilityLatLng({
      latitude: record.latitude,
      longitude: record.longitude,
    });
    if (!coords) continue;

    const normalized: LocalAedRecord = {
      ...record,
      latitude: coords.lat,
      longitude: coords.lng,
    };
    const key = aedGridKey(coords.lat, coords.lng);
    const bucket = grid.get(key);
    if (bucket) {
      bucket.push(normalized);
    } else {
      grid.set(key, [normalized]);
    }
  }
  return grid;
}

function getAedSpatialGrid(): AedSpatialGrid {
  if (!aedSpatialGrid) {
    aedSpatialGrid = buildAedSpatialGrid();
  }
  return aedSpatialGrid;
}

function collectAedGridCandidates(coordinate: GeoCoordinate, radiusMeters: number): LocalAedRecord[] {
  const grid = getAedSpatialGrid();
  const latPad = (radiusMeters * 1.15) / 111_000;
  const lngPad =
    (radiusMeters * 1.15) / (111_000 * Math.cos((coordinate.latitude * Math.PI) / 180));

  const minLatCell = Math.floor((coordinate.latitude - latPad) / AED_GRID_CELL);
  const maxLatCell = Math.floor((coordinate.latitude + latPad) / AED_GRID_CELL);
  const minLngCell = Math.floor((coordinate.longitude - lngPad) / AED_GRID_CELL);
  const maxLngCell = Math.floor((coordinate.longitude + lngPad) / AED_GRID_CELL);

  const candidates: LocalAedRecord[] = [];
  for (let latCell = minLatCell; latCell <= maxLatCell; latCell += 1) {
    for (let lngCell = minLngCell; lngCell <= maxLngCell; lngCell += 1) {
      const bucket = grid.get(`${latCell}:${lngCell}`);
      if (bucket) {
        candidates.push(...bucket);
      }
    }
  }
  return candidates;
}

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

/** 수동 지역 검색용 — 유휴 시 백그라운드에서 격자 인덱스 준비 */
export function warmAedSearchIndex(): void {
  if (aedSpatialGrid || indexWarmScheduled) return;
  indexWarmScheduled = true;

  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      getAedSpatialGrid();
    }, 250);
  });
}

function toAedMarker(item: IndexedAed, distanceM: number): LocalAedMarker {
  return {
    ...item,
    distanceM,
    walkMin: estimateWalkMinutes(distanceM),
  };
}

function rankByDistance(items: IndexedAed[], coordinate: GeoCoordinate): LocalAedMarker[] {
  return items
    .map((item) => {
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return toAedMarker(item, distanceM);
    })
    .sort((a, b) => a.distanceM - b.distanceM);
}

function searchAedsByRadiusFast(
  coordinate: GeoCoordinate,
  radiusMeters: number,
  limit: number,
  query: string,
): LocalAedMarker[] {
  const bboxCandidates = collectAedGridCandidates(coordinate, radiusMeters);
  const ranked: LocalAedMarker[] = [];

  for (let index = 0; index < bboxCandidates.length; index += 1) {
    const raw = bboxCandidates[index];
    const normalized = normalizeAedRecord(raw, index);
    if (!normalized) continue;

    if (query.trim()) {
      const q = normalizeFacilityName(query);
      if (
        !normalized.searchKey.includes(q) &&
        !normalizeFacilityName(normalized.name).includes(q) &&
        !normalizeFacilityName(normalized.address).includes(q) &&
        !normalizeFacilityName(normalized.location).includes(q)
      ) {
        continue;
      }
    }

    const distanceM = calculateDistanceMeters(coordinate, {
      latitude: normalized.latitude,
      longitude: normalized.longitude,
    });
    if (distanceM > radiusMeters) continue;

    ranked.push(toAedMarker(normalized, distanceM));

    if (ranked.length > limit * 4) {
      ranked.sort((a, b) => a.distanceM - b.distanceM);
      ranked.length = limit;
    }
  }

  ranked.sort((a, b) => a.distanceM - b.distanceM);
  return ranked.slice(0, limit);
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

  if (useGpsRadius) {
    return searchAedsByRadiusFast(coordinate, radiusMeters, limit, query);
  }

  let items = getAedIndex();
  if (options.regionFilter?.stage1) {
    items = filterCoordinatesByFacilityRegion(items, options.regionFilter, coordinate);
    items = items.filter((item) => {
      const address = item.address?.trim() || item.location?.trim();
      if (!address) return true;
      return matchesFacilityRegion(address, '', options.regionFilter!);
    });
  }

  items = filterByQuery(items, query);

  const roughRadius = options.regionFilter?.stage1 ? radiusMeters * 4 : radiusMeters;
  const bboxFiltered = filterByRoughRadius(items, coordinate, roughRadius);
  const ranked = rankByDistance(bboxFiltered, coordinate);
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
