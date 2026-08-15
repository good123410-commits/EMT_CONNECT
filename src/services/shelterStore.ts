import {
  calculateDistanceMeters,
  estimateWalkMinutes,
} from '@/services/emergencyApi';
import { matchesFacilityRegion, parseFacilityAddressRegion } from '@/services/facilityRegionFilter';
import { normalizeFacilityName } from '@/services/localFacilityStore';
import type { GeoCoordinate } from '@/services/locationService';
import type {
  LocalShelterMarker,
  LocalShelterSearchOptions,
  ShelterJsonRecord,
} from '@/types/shelter';
import type { MapBounds } from '@/utils/mapViewport';
import { isValidCoordinate } from '@/utils/mapViewport';
import { isValidWebMercatorCoordinate, webMercatorToWgs84 } from '@/utils/webMercator';

const DEFAULT_LIST_LIMIT = 80;
const DEFAULT_GPS_RADIUS_M = 15_000;
const DEFAULT_BOUNDS_LIMIT = 200;

type IndexedShelter = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  searchKey: string;
  regionStage1: string;
  regionStage2: string;
};

let shelterIndex: IndexedShelter[] | null = null;
let shelterLoadPromise: Promise<IndexedShelter[]> | null = null;

function buildShelterId(item: ShelterJsonRecord, index: number): string {
  return `shelter_${index}_${item.x.toFixed(2)}_${item.y.toFixed(2)}`;
}

function buildSearchKey(name: string, address: string): string {
  return `${normalizeFacilityName(name)} ${normalizeFacilityName(address)}`;
}

function normalizeShelterRecord(item: ShelterJsonRecord, index: number): IndexedShelter | null {
  if (!isValidWebMercatorCoordinate(item.x, item.y)) return null;

  const { latitude, longitude } = webMercatorToWgs84(item.x, item.y);
  if (!isValidCoordinate({ latitude, longitude })) return null;

  const name = item.cc_nm?.trim() || '쉼터';
  const address = item.rn_adres?.trim() || '';
  const parsedRegion = parseFacilityAddressRegion(address);

  return {
    id: buildShelterId(item, index),
    name,
    address,
    latitude,
    longitude,
    searchKey: buildSearchKey(name, address),
    regionStage1: parsedRegion?.stage1 ?? '',
    regionStage2: parsedRegion?.stage2 ?? '',
  };
}

/** 쉼터 JSON은 쉼터 탭 진입 시에만 로드 (웹 번들·메인 스레드 부담 방지) */
async function ensureShelterIndex(): Promise<IndexedShelter[]> {
  if (shelterIndex) return shelterIndex;
  if (!shelterLoadPromise) {
    shelterLoadPromise = import('../../assets/data/generated/shelters.json').then((mod) => {
      const records = mod.default as ShelterJsonRecord[];
      shelterIndex = records
        .map((item, index) => normalizeShelterRecord(item, index))
        .filter((item): item is IndexedShelter => item !== null);
      if (__DEV__) {
        console.log('[shelterStore] indexed shelters', shelterIndex.length);
      }
      return shelterIndex;
    });
  }
  return shelterLoadPromise;
}

function withDistance(items: IndexedShelter[], coordinate: GeoCoordinate): LocalShelterMarker[] {
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

function filterByQuery(items: IndexedShelter[], query: string): IndexedShelter[] {
  const q = normalizeFacilityName(query);
  if (!q) return items;

  return items.filter(
    (item) =>
      item.searchKey.includes(q) ||
      normalizeFacilityName(item.name).includes(q) ||
      normalizeFacilityName(item.address).includes(q),
  );
}

function filterByRegion(
  items: IndexedShelter[],
  regionFilter?: LocalShelterSearchOptions['regionFilter'],
): IndexedShelter[] {
  if (!regionFilter?.stage1) return items;
  return items.filter((item) =>
    matchesFacilityRegion(item.address, item.regionStage2, regionFilter),
  );
}

function isInsideBounds(item: IndexedShelter, bounds: MapBounds): boolean {
  return (
    item.latitude >= bounds.minLat &&
    item.latitude <= bounds.maxLat &&
    item.longitude >= bounds.minLng &&
    item.longitude <= bounds.maxLng
  );
}

/** 리스트용 — GPS 반경 또는 지역·검색어 기준 상위 N건 */
export async function searchLocalShelters(
  query: string,
  coordinate: GeoCoordinate,
  options: LocalShelterSearchOptions = {},
): Promise<LocalShelterMarker[]> {
  const limit = options.limit ?? DEFAULT_LIST_LIMIT;
  const radiusMeters = options.radiusMeters ?? DEFAULT_GPS_RADIUS_M;
  const useGpsRadius = !options.regionFilter?.stage1 && !query.trim();

  let items = await ensureShelterIndex();
  items = filterByRegion(items, options.regionFilter);
  items = filterByQuery(items, query);

  const ranked = withDistance(items, coordinate);

  if (useGpsRadius) {
    return ranked.filter((item) => item.distanceM <= radiusMeters).slice(0, limit);
  }

  return ranked.slice(0, limit);
}

/** 지도용 — 현재 뷰포트 bounds 안의 쉼터만 반환 (성능) */
export async function searchSheltersInBounds(
  bounds: MapBounds,
  coordinate: GeoCoordinate,
  options: LocalShelterSearchOptions & { query?: string } = {},
): Promise<LocalShelterMarker[]> {
  const limit = options.limit ?? DEFAULT_BOUNDS_LIMIT;

  let items = await ensureShelterIndex();
  items = filterByRegion(items, options.regionFilter);
  items = filterByQuery(items, options.query ?? '');

  const inBounds = items.filter((item) => isInsideBounds(item, bounds));
  return withDistance(inBounds, coordinate).slice(0, limit);
}

export async function findLocalShelterById(
  id: string,
  coordinate: GeoCoordinate,
): Promise<LocalShelterMarker | undefined> {
  const item = (await ensureShelterIndex()).find((record) => record.id === id);
  if (!item) return undefined;

  const distanceM = calculateDistanceMeters(coordinate, {
    latitude: item.latitude,
    longitude: item.longitude,
  });

  return {
    ...item,
    distanceM,
    walkMin: estimateWalkMinutes(distanceM),
  };
}

export async function getShelterRecordCount(): Promise<number> {
  return (await ensureShelterIndex()).length;
}
