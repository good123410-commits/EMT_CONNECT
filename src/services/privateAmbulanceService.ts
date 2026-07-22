import ambulanceData from '@/data/generated/private_ambulances.json';
import { supabase } from '@/lib/supabaseClient';
import {
  calculateDistanceMeters,
} from '@/services/emergencyApi';
import type { GeoCoordinate } from '@/services/locationService';
import type {
  PrivateAmbulanceListItem,
  PrivateAmbulanceRecord,
  PrivateAmbulanceRegionQuery,
  PrivateAmbulanceSearchQuery,
} from '@/types/privateAmbulance';
import type { AdminPrivateAmbulance } from '@/types/admin';
import { adminListPrivateAmbulances } from '@/services/adminService';
import { SIDO_LIST } from '@/services/locationService';
import { normalizeFacilityName } from '@/services/localFacilityStore';

const RECORDS = ambulanceData as PrivateAmbulanceRecord[];

const SHORT_SIDO_ALIAS: Record<string, string> = {
  서울: '서울',
  부산: '부산',
  대구: '대구',
  인천: '인천',
  광주: '광주',
  대전: '대전',
  울산: '울산',
  세종: '세종',
  경기: '경기',
  강원: '강원',
  충북: '충북',
  충남: '충남',
  전북: '전북',
  전남: '전남',
  경북: '경북',
  경남: '경남',
  제주: '제주',
};

const FULL_SIDO_TO_SHORT: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
};

function normalizeSidoShort(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (FULL_SIDO_TO_SHORT[trimmed]) return FULL_SIDO_TO_SHORT[trimmed];
  if (SHORT_SIDO_ALIAS[trimmed]) return SHORT_SIDO_ALIAS[trimmed];
  const compact = trimmed.replace(/특별시|광역시|특별자치시|특별자치도|도/g, '').trim();
  return SHORT_SIDO_ALIAS[compact] ?? compact;
}

let indexed: PrivateAmbulanceRecord[] | null = null;
let dbOverrideByExternalId = new Map<string, PrivateAmbulanceRecord>();
let dbExtraRecords: PrivateAmbulanceRecord[] = [];
let dbHydratePromise: Promise<void> | null = null;

function mapDbRowToRecord(row: {
  external_id: string | null;
  name: string;
  vehicle_type: string | null;
  vehicle_count: number;
  region: string | null;
  address: string | null;
  phone: string;
  sido: string;
  sigungu: string;
  latitude: number | null;
  longitude: number | null;
}): PrivateAmbulanceRecord {
  return {
    i: row.external_id?.trim() || `DB-${row.name.slice(0, 12)}`,
    n: row.name,
    t: row.vehicle_type ?? '',
    vc: row.vehicle_count,
    r: row.region ?? `${row.sido} ${row.sigungu}`,
    a: row.address ?? row.region ?? `${row.sido} ${row.sigungu}`,
    p: row.phone,
    lat: row.latitude,
    lng: row.longitude,
    sd: normalizeSidoShort(row.sido),
    sg: row.sigungu,
  };
}

export async function refreshPrivateAmbulanceDbOverrides(): Promise<void> {
  const { data, error } = await supabase.from('private_ambulances').select('*').limit(2000);
  if (error) return;

  const nextOverride = new Map<string, PrivateAmbulanceRecord>();
  const bundledIds = new Set(getRecordsRaw().map((r) => r.i));
  const extras: PrivateAmbulanceRecord[] = [];

  for (const row of data ?? []) {
    const record = mapDbRowToRecord(row as Parameters<typeof mapDbRowToRecord>[0]);
    const key = (row as { external_id?: string | null }).external_id?.trim();
    if (key && bundledIds.has(key)) {
      nextOverride.set(key, record);
    } else if (key) {
      nextOverride.set(key, record);
    } else {
      extras.push(record);
    }
  }

  dbOverrideByExternalId = nextOverride;
  dbExtraRecords = extras;
  indexed = null;
}

async function ensurePrivateAmbulanceDbHydrated(): Promise<void> {
  if (!dbHydratePromise) {
    dbHydratePromise = refreshPrivateAmbulanceDbOverrides();
  }
  await dbHydratePromise;
}

function getRecordsRaw(): PrivateAmbulanceRecord[] {
  return RECORDS;
}

function getRecords(): PrivateAmbulanceRecord[] {
  if (!indexed) {
    const merged = getRecordsRaw().map((record) => dbOverrideByExternalId.get(record.i) ?? record);
    indexed = [...merged, ...dbExtraRecords];
  }
  return indexed;
}

function sigunguMatches(recordSigungu: string, querySigungu: string): boolean {
  const recordKey = normalizeFacilityName(recordSigungu);
  const queryKey = normalizeFacilityName(querySigungu);
  if (!queryKey) return true;
  if (!recordKey) return false;
  return recordKey === queryKey || recordKey.includes(queryKey) || queryKey.includes(recordKey);
}

function matchesRegionQuery(record: PrivateAmbulanceRecord, query: PrivateAmbulanceRegionQuery): boolean {
  if (!query.sido && !query.sigungu) return true;

  const recordSido = normalizeSidoShort(record.sd);
  const querySido = normalizeSidoShort(query.sido);
  if (querySido && recordSido !== querySido) return false;
  if (query.sigungu) return sigunguMatches(record.sg, query.sigungu);
  return true;
}

function withDistance(
  records: PrivateAmbulanceRecord[],
  coordinate?: GeoCoordinate,
): PrivateAmbulanceListItem[] {
  return records.map((record) => {
    if (
      coordinate &&
      typeof record.lat === 'number' &&
      typeof record.lng === 'number' &&
      Number.isFinite(record.lat) &&
      Number.isFinite(record.lng)
    ) {
      return {
        ...record,
        distanceM: calculateDistanceMeters(coordinate, {
          latitude: record.lat,
          longitude: record.lng,
        }),
      };
    }
    return { ...record, distanceM: null };
  });
}

function sortByProximity(items: PrivateAmbulanceListItem[]): PrivateAmbulanceListItem[] {
  return [...items].sort((a, b) => {
    if (a.distanceM != null && b.distanceM != null) return a.distanceM - b.distanceM;
    if (a.distanceM != null) return -1;
    if (b.distanceM != null) return 1;
    return a.n.localeCompare(b.n, 'ko');
  });
}

/** GPS 기준 인근 업체 (시군구 우선 → 거리순) */
export function listNearbyPrivateAmbulances(
  coordinate: GeoCoordinate,
  region: { stage1: string; stage2: string },
  limit = 40,
): PrivateAmbulanceListItem[] {
  void ensurePrivateAmbulanceDbHydrated();
  const all = getRecords();
  const shortSido = normalizeSidoShort(region.stage1);

  const sameSigungu = all.filter(
    (r) =>
      normalizeSidoShort(r.sd) === shortSido && sigunguMatches(r.sg, region.stage2),
  );
  const sameSido = all.filter((r) => normalizeSidoShort(r.sd) === shortSido);

  const pool = sameSigungu.length > 0 ? sameSigungu : sameSido.length > 0 ? sameSido : all;
  return sortByProximity(withDistance(pool, coordinate)).slice(0, limit);
}

/** 출발지·목적지 지역 필터 검색 */
export function searchPrivateAmbulances(
  query: PrivateAmbulanceSearchQuery,
  coordinate?: GeoCoordinate,
  limit = 60,
): PrivateAmbulanceListItem[] {
  void ensurePrivateAmbulanceDbHydrated();
  const { departure, destination } = query;
  const hasDeparture = Boolean(departure.sido || departure.sigungu);
  const hasDestination = Boolean(destination.sido || destination.sigungu);

  let filtered = getRecords();

  if (hasDeparture || hasDestination) {
    filtered = filtered.filter((record) => {
      const depMatch = hasDeparture ? matchesRegionQuery(record, departure) : false;
      const destMatch = hasDestination ? matchesRegionQuery(record, destination) : false;
      if (hasDeparture && hasDestination) return depMatch || destMatch;
      if (hasDeparture) return depMatch;
      return destMatch;
    });
  }

  return sortByProximity(withDistance(filtered, coordinate)).slice(0, limit);
}

export function formatAmbulancePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone.trim();
}

export function phoneDialUri(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `tel:${digits}`;
}

export const PRIVATE_AMBULANCE_DISCLAIMER =
  '※ 본 서비스는 사설 구급차 업체 정보를 제공합니다. 실제 연결 시 \'EMS Connect에서 연결된 요청\'임을 언급하면 원활한 상담이 가능합니다.';

export const PRIVATE_AMBULANCE_CALL_GUIDE =
  'EMS Connect를 통해 연결된 구급차 요청건임을 밝히고 상담을 시작하세요.';

export type AdminPrivateAmbulanceCatalogItem = AdminPrivateAmbulance & {
  source: 'bundled' | 'database';
  catalog_id: string;
};

function bundledRecordToAdminItem(record: PrivateAmbulanceRecord): AdminPrivateAmbulanceCatalogItem {
  return {
    catalog_id: record.i,
    source: 'bundled',
    id: `bundled:${record.i}`,
    external_id: record.i,
    name: record.n,
    vehicle_type: record.t,
    vehicle_count: record.vc,
    region: record.r,
    address: record.a,
    phone: record.p,
    sido: record.sd,
    sigungu: record.sg,
    latitude: record.lat,
    longitude: record.lng,
    created_at: '',
    updated_at: '',
  };
}

function dbRowToCatalogItem(row: AdminPrivateAmbulance): AdminPrivateAmbulanceCatalogItem {
  return {
    ...row,
    catalog_id: row.id,
    source: 'database',
  };
}

function matchesAmbulanceFilters(
  item: AdminPrivateAmbulanceCatalogItem,
  filters: { sido?: string; sigungu?: string; search?: string },
): boolean {
  const querySido = filters.sido ? normalizeSidoShort(filters.sido) : '';
  const itemSido = normalizeSidoShort(item.sido);
  if (querySido && itemSido !== querySido) return false;

  if (filters.sigungu?.trim()) {
    if (!sigunguMatches(item.sigungu, filters.sigungu.trim())) return false;
  }

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const hay = `${item.name} ${item.phone}`.toLowerCase();
    if (!hay.includes(search)) return false;
  }

  return true;
}

/** 앱 JSON(민간구급차) + Supabase 오버레이 병합 목록 — 관리자 탭용 */
export async function fetchAdminPrivateAmbulanceCatalog(filters: {
  sido?: string;
  sigungu?: string;
  search?: string;
  limit?: number;
}): Promise<AdminPrivateAmbulanceCatalogItem[]> {
  await ensurePrivateAmbulanceDbHydrated();
  const bundled = getRecords().map(bundledRecordToAdminItem);

  let dbRows: AdminPrivateAmbulance[] = [];
  try {
    dbRows = await adminListPrivateAmbulances({
      sido: filters.sido,
      sigungu: filters.sigungu,
      search: filters.search,
      limit: filters.limit ?? 500,
    });
  } catch {
    dbRows = [];
  }

  const byExternal = new Map<string, AdminPrivateAmbulanceCatalogItem>();
  for (const item of bundled) {
    byExternal.set(item.external_id ?? item.catalog_id, item);
  }

  for (const row of dbRows) {
    const key = row.external_id?.trim() || row.id;
    byExternal.set(key, dbRowToCatalogItem(row));
  }

  const merged = [...byExternal.values()].filter((item) => matchesAmbulanceFilters(item, filters));
  merged.sort((a, b) => {
    const sido = a.sido.localeCompare(b.sido, 'ko');
    if (sido !== 0) return sido;
    const sigungu = a.sigungu.localeCompare(b.sigungu, 'ko');
    if (sigungu !== 0) return sigungu;
    return a.name.localeCompare(b.name, 'ko');
  });

  return merged.slice(0, filters.limit ?? 300);
}

export function resolveAmbulanceUpsertIds(item: AdminPrivateAmbulanceCatalogItem): {
  dbId?: string;
  externalId?: string;
} {
  if (item.source === 'database' && !item.id.startsWith('bundled:')) {
    return { dbId: item.id, externalId: item.external_id ?? undefined };
  }
  return { externalId: item.external_id ?? item.catalog_id };
}


export function getAmbulanceSidoOptions(): readonly string[] {
  return SIDO_LIST;
}

const ambulanceSigunguCache = new Map<string, string[]>();

/** 민간 구급차 CSV 기반 시군구 목록 */
export function getAmbulanceSigunguOptionsForSido(sido: string): string[] {
  const shortSido = normalizeSidoShort(sido);
  if (!shortSido) return [];

  const cached = ambulanceSigunguCache.get(shortSido);
  if (cached) return cached;

  const set = new Set<string>();
  for (const record of getRecords()) {
    if (normalizeSidoShort(record.sd) !== shortSido) continue;
    if (record.sg?.trim()) set.add(record.sg.trim());
  }

  const list = [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  ambulanceSigunguCache.set(shortSido, list);
  return list;
}
