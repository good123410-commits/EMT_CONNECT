import hospitalData from '@/data/generated/hospital_data.json';
import { supabase } from '@/lib/supabaseClient';
import {
  adminListCustomHospitals,
} from '@/services/adminService';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
  isMoonlightChildrenHospital,
} from '@/services/emergencyApi';
import type { HospitalFinderItem } from '@/services/hospitalFinderService';
import {
  buildFacilityMatchKey,
  normalizeFacilityName,
} from '@/services/localFacilityStore';
import type { GeoCoordinate } from '@/services/locationService';
import { SIDO_LIST } from '@/services/locationService';
import type { AdminCustomHospital as AdminCustomHospitalType } from '@/types/admin';
import type {
  CustomHospitalOverlay,
  CustomHospitalRow,
  CustomHospitalType,
} from '@/types/customHospital';
import type { LocalHospitalRecord } from '@/types/localFacility';
import { getSidoOptions, getSigunguOptionsForSido } from '@/utils/regionOptions';
import {
  formatOperatingHoursText,
  parseOperatingHoursText,
  resolveHospitalOpenStatus,
  type HospitalDutyDay,
} from '@/utils/hospitalHours';
import {
  mapCustomHospitalRowToErOverride,
  type HospitalErOverride,
} from '@/utils/hospitalEquipmentOverride';

const BUNDLED_HOSPITALS = hospitalData as LocalHospitalRecord[];

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

let dbOverrideByExternalId = new Map<string, CustomHospitalRow>();
let dbExtraRows: CustomHospitalRow[] = [];
let hiddenBundledIds = new Set<string>();
let overlayByHospitalId = new Map<string, CustomHospitalOverlay>();
let erOverrideByHospitalId = new Map<string, HospitalErOverride>();
let dbHydratePromise: Promise<void> | null = null;
let onIndexInvalidate: (() => void) | null = null;

export function registerHospitalIndexInvalidator(callback: () => void): void {
  onIndexInvalidate = callback;
}

function invalidateHospitalIndex(): void {
  onIndexInvalidate?.();
}

function normalizeSidoShort(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (FULL_SIDO_TO_SHORT[trimmed]) return FULL_SIDO_TO_SHORT[trimmed];
  return trimmed.replace(/특별시|광역시|특별자치시|특별자치도|도/g, '').trim();
}

function parseWeeklySchedule(raw: unknown): HospitalDutyDay[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is HospitalDutyDay => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof (item as HospitalDutyDay).dayCode === 'number'
    );
  });
}

function mapRowToOverlay(row: CustomHospitalRow, isCustomOnly: boolean): CustomHospitalOverlay {
  const weeklySchedule = parseWeeklySchedule(row.operating_hours);
  const openStatus = weeklySchedule.length
    ? resolveHospitalOpenStatus(weeklySchedule)
    : { isOpenNow: false, label: '확인 필요' };

  return {
    isPartner: row.is_partner,
    customMemo: row.custom_memo ?? undefined,
    specialties: row.departments ?? [],
    weeklySchedule,
    isOpenNow: openStatus.isOpenNow,
    openStatusLabel: openStatus.label,
    hospitalType: row.hospital_type,
    isCustomOnly,
  };
}

function mapRowToLocalRecord(row: CustomHospitalRow): LocalHospitalRecord {
  const id = row.external_id?.trim() || row.hpid?.trim() || `DB-${row.id}`;
  const erCapable = row.er_capable || row.hospital_type === 'er';
  const facilityType =
    row.hospital_type === 'er'
      ? '응급의료기관'
      : row.hospital_type === 'moonlight'
        ? '달빛어린이병원'
        : row.hospital_type === 'pediatric'
          ? '소아의료기관'
          : '의료기관';

  return {
    i: id,
    n: row.name,
    a: row.address ?? `${row.sido} ${row.sigungu}`,
    p: row.tel || '-',
    lat: Number(row.latitude) || 0,
    lng: Number(row.longitude) || 0,
    sg: row.sigungu,
    td: facilityType,
    er: erCapable ? 1 : 0,
  };
}

export async function refreshCustomHospitalDbOverrides(): Promise<void> {
  try {
    const { data, error } = await supabase.from('custom_hospitals').select('*').limit(3000);
    if (error) {
      if (__DEV__) console.warn('[CustomHospital] refresh failed', error.message);
      return;
    }

    const bundledIds = new Set(BUNDLED_HOSPITALS.map((item) => item.i));
    const nextOverride = new Map<string, CustomHospitalRow>();
    const nextExtras: CustomHospitalRow[] = [];
    const nextHidden = new Set<string>();
    const nextOverlay = new Map<string, CustomHospitalOverlay>();
    const nextErOverride = new Map<string, HospitalErOverride>();

    for (const raw of data ?? []) {
      const row = raw as CustomHospitalRow;
      const externalId = row.external_id?.trim();
      const hospitalId = externalId || row.hpid?.trim() || row.id;
      const isCustomOnly = !externalId || !bundledIds.has(externalId);
      const overlay = mapRowToOverlay(row, isCustomOnly);
      const erOverride = mapCustomHospitalRowToErOverride(row);

      if (row.is_hidden) {
        if (externalId && bundledIds.has(externalId)) {
          nextHidden.add(externalId);
        }
        continue;
      }

      nextOverlay.set(hospitalId, overlay);
      if (erOverride) {
        nextErOverride.set(hospitalId, erOverride);
      }

      if (externalId) {
        nextOverride.set(externalId, row);
        nextOverlay.set(externalId, overlay);
        if (erOverride) nextErOverride.set(externalId, erOverride);
        if (!bundledIds.has(externalId)) {
          nextExtras.push(row);
        }
        continue;
      }

      nextExtras.push(row);
      nextOverlay.set(hospitalId, overlay);
    }

    dbOverrideByExternalId = nextOverride;
    dbExtraRows = nextExtras;
    hiddenBundledIds = nextHidden;
    overlayByHospitalId = nextOverlay;
    erOverrideByHospitalId = nextErOverride;
    invalidateHospitalIndex();
  } catch (error) {
    if (__DEV__) console.warn('[CustomHospital] refresh error', error);
  }
}

export async function ensureCustomHospitalDbHydrated(): Promise<void> {
  if (!dbHydratePromise) {
    dbHydratePromise = refreshCustomHospitalDbOverrides();
  }
  await dbHydratePromise;
}

export function getCustomHospitalOverlay(hospitalId: string): CustomHospitalOverlay | undefined {
  return overlayByHospitalId.get(hospitalId);
}

export function getHospitalErOverride(hospitalId: string): HospitalErOverride | undefined {
  return erOverrideByHospitalId.get(hospitalId);
}

export function getMergedBundledHospitalRecords(): LocalHospitalRecord[] {
  const merged: LocalHospitalRecord[] = [];

  for (const bundled of BUNDLED_HOSPITALS) {
    if (hiddenBundledIds.has(bundled.i)) continue;

    const override = dbOverrideByExternalId.get(bundled.i);
    if (override) {
      merged.push(mapRowToLocalRecord({ ...override, external_id: bundled.i }));
      continue;
    }

    merged.push(bundled);
  }

  for (const extra of dbExtraRows) {
    if (extra.is_hidden) continue;
    merged.push(mapRowToLocalRecord(extra));
  }

  return merged;
}

function sigunguMatches(recordSigungu: string, querySigungu: string): boolean {
  const recordKey = normalizeFacilityName(recordSigungu);
  const queryKey = normalizeFacilityName(querySigungu);
  if (!queryKey) return true;
  if (!recordKey) return false;
  return recordKey === queryKey || recordKey.includes(queryKey) || queryKey.includes(recordKey);
}

function matchesRegionFilter(
  record: Pick<LocalHospitalRecord, 'a' | 'sg'>,
  sido?: string,
  sigungu?: string,
): boolean {
  if (!sido?.trim()) return true;
  const shortSido = normalizeSidoShort(sido);
  const address = record.a ?? '';
  const matchesSido =
    address.includes(sido) ||
    address.includes(shortSido) ||
    normalizeFacilityName(record.sg).includes(normalizeFacilityName(shortSido));
  if (!matchesSido) return false;
  if (sigungu?.trim()) return sigunguMatches(record.sg, sigungu);
  return true;
}

function customRowToFinderItem(
  row: CustomHospitalRow,
  coordinate: GeoCoordinate,
): HospitalFinderItem {
  const weeklySchedule = parseWeeklySchedule(row.operating_hours);
  const openStatus = weeklySchedule.length
    ? resolveHospitalOpenStatus(weeklySchedule)
    : { isOpenNow: false, label: '확인 필요' };

  const lat = Number(row.latitude) || 0;
  const lng = Number(row.longitude) || 0;
  const distanceM =
    lat && lng
      ? calculateDistanceMeters(coordinate, { latitude: lat, longitude: lng })
      : 0;

  const isMoonlight =
    row.hospital_type === 'moonlight' || isMoonlightChildrenHospital(row.name);
  const isPediatric = row.hospital_type === 'pediatric' || row.hospital_type === 'moonlight';

  return {
    hpid: row.external_id?.trim() || row.hpid?.trim() || row.id,
    name: row.name,
    address: row.address ?? `${row.sido} ${row.sigungu}`,
    phone: row.tel || '-',
    latitude: lat,
    longitude: lng,
    distanceM,
    distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
    walkMin: estimateWalkMinutes(distanceM),
    facilityType:
      row.hospital_type === 'moonlight'
        ? '달빛어린이병원'
        : row.hospital_type === 'pediatric'
          ? '소아의료기관'
          : '의료기관',
    specialties: row.departments ?? [],
    weeklySchedule,
    isMoonlightHospital: isMoonlight,
    isPediatricCenter: isPediatric,
    isOpenNow: openStatus.isOpenNow,
    openStatusLabel: openStatus.label,
    description: row.custom_memo ?? undefined,
    isPartner: row.is_partner,
    customMemo: row.custom_memo ?? undefined,
    isCustomRecord: true,
  };
}

export function mergeCustomHospitalsIntoPediatricList(
  items: HospitalFinderItem[],
  coordinate: GeoCoordinate,
  region?: { stage1: string; stage2?: string },
): HospitalFinderItem[] {
  void ensureCustomHospitalDbHydrated();

  const pediatricTypes = new Set<CustomHospitalType>(['moonlight', 'pediatric']);
  const customRows = [
    ...dbOverrideByExternalId.values(),
    ...dbExtraRows,
  ].filter((row) => !row.is_hidden && pediatricTypes.has(row.hospital_type));

  const map = new Map<string, HospitalFinderItem>();
  for (const item of items) {
    const key = item.hpid || buildFacilityMatchKey(item.name, item.address);
    map.set(key, item);
  }

  for (const row of customRows) {
    if (!matchesRegionFilter({ a: row.address ?? '', sg: row.sigungu }, region?.stage1, region?.stage2)) {
      continue;
    }

    const customItem = customRowToFinderItem(row, coordinate);
    const key =
      customItem.hpid || buildFacilityMatchKey(customItem.name, customItem.address);
    const existing = map.get(key);

    if (existing) {
      map.set(key, {
        ...existing,
        specialties: customItem.specialties.length ? customItem.specialties : existing.specialties,
        weeklySchedule: customItem.weeklySchedule.length
          ? customItem.weeklySchedule
          : existing.weeklySchedule,
        isOpenNow: customItem.weeklySchedule.length ? customItem.isOpenNow : existing.isOpenNow,
        openStatusLabel: customItem.weeklySchedule.length
          ? customItem.openStatusLabel
          : existing.openStatusLabel,
        isMoonlightHospital:
          existing.isMoonlightHospital || customItem.isMoonlightHospital,
        isPediatricCenter: existing.isPediatricCenter || customItem.isPediatricCenter,
        description: customItem.customMemo || existing.description,
        isPartner: customItem.isPartner || existing.isPartner,
        customMemo: customItem.customMemo || existing.customMemo,
        isCustomRecord: true,
      });
    } else {
      map.set(key, customItem);
    }
  }

  return [...map.values()].sort((a, b) => a.distanceM - b.distanceM);
}

export type AdminCustomHospitalCatalogItem = AdminCustomHospitalType & {
  source: 'bundled' | 'database';
  catalog_id: string;
};

function resolveSidoFromAddress(address: string): string {
  for (const item of SIDO_LIST) {
    if (address.includes(item)) return item;
  }
  return '';
}

function bundledRecordToCatalogItem(record: LocalHospitalRecord): AdminCustomHospitalCatalogItem {
  const moonlight = isMoonlightChildrenHospital(record.n);
  return {
    catalog_id: record.i,
    source: 'bundled',
    id: `bundled:${record.i}`,
    external_id: record.i,
    hpid: record.i,
    name: record.n,
    hospital_type: record.er === 1 ? 'er' : moonlight ? 'moonlight' : 'general',
    sido: resolveSidoFromAddress(record.a),
    sigungu: record.sg,
    address: record.a,
    tel: record.p,
    operating_hours: [],
    departments: [],
    custom_memo: null,
    is_hidden: false,
    is_partner: false,
    er_capable: record.er === 1,
    latitude: record.lat,
    longitude: record.lng,
    created_at: '',
    updated_at: '',
  };
}

function dbRowToCatalogItem(row: AdminCustomHospitalType): AdminCustomHospitalCatalogItem {
  return {
    ...row,
    catalog_id: row.id,
    source: 'database',
  };
}

function matchesHospitalFilters(
  item: AdminCustomHospitalCatalogItem,
  filters: { sido?: string; sigungu?: string; search?: string },
): boolean {
  const querySido = filters.sido ? normalizeSidoShort(filters.sido) : '';
  const itemSido = normalizeSidoShort(item.sido);
  if (querySido && itemSido !== querySido && !item.sido.includes(filters.sido ?? '')) return false;

  if (filters.sigungu?.trim()) {
    if (!sigunguMatches(item.sigungu, filters.sigungu.trim())) return false;
  }

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const hay = `${item.name} ${item.tel} ${item.address ?? ''} ${item.hpid ?? ''}`.toLowerCase();
    if (!hay.includes(search)) return false;
  }

  return true;
}

export async function fetchAdminCustomHospitalCatalog(filters: {
  sido?: string;
  sigungu?: string;
  search?: string;
  limit?: number;
}): Promise<AdminCustomHospitalCatalogItem[]> {
  await ensureCustomHospitalDbHydrated();

  const bundled = BUNDLED_HOSPITALS.map(bundledRecordToCatalogItem);
  const bundledById = new Map(bundled.map((item) => [item.external_id ?? item.catalog_id, item]));

  let dbRows: AdminCustomHospitalType[] = [];
  try {
    dbRows = await adminListCustomHospitals({
      sido: filters.sido,
      sigungu: filters.sigungu,
      search: filters.search,
      includeHidden: true,
      limit: filters.limit ?? 500,
    });
  } catch {
    dbRows = [];
  }

  const merged = new Map<string, AdminCustomHospitalCatalogItem>();

  for (const item of bundled) {
    merged.set(item.catalog_id, item);
  }

  for (const row of dbRows) {
    const externalId = row.external_id?.trim();
    if (externalId && bundledById.has(externalId)) {
      merged.set(`bundled:${externalId}`, {
        ...bundledById.get(externalId)!,
        ...row,
        catalog_id: `bundled:${externalId}`,
        source: 'database',
        id: row.id,
      });
    } else {
      merged.set(row.id, dbRowToCatalogItem(row));
    }
  }

  return [...merged.values()]
    .filter((item) => matchesHospitalFilters(item, filters))
    .slice(0, filters.limit ?? 300);
}

export function resolveCustomHospitalUpsertIds(item: AdminCustomHospitalCatalogItem): {
  dbId?: string;
  externalId?: string;
} {
  if (item.source === 'database' && !item.id.startsWith('bundled:')) {
    return { dbId: item.id, externalId: item.external_id ?? undefined };
  }
  return { externalId: item.external_id ?? item.catalog_id.replace(/^bundled:/, '') };
}

export function getHospitalSidoOptions(): string[] {
  return [...getSidoOptions()];
}

export function getHospitalSigunguOptionsForSido(sido: string): string[] {
  return getSigunguOptionsForSido(sido);
}

export function serializeOperatingHoursForForm(raw: unknown): string {
  return formatOperatingHoursText(parseWeeklySchedule(raw));
}

export function parseOperatingHoursForSave(text: string): HospitalDutyDay[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      return parseWeeklySchedule(JSON.parse(trimmed));
    } catch {
      return parseOperatingHoursText(trimmed);
    }
  }
  return parseOperatingHoursText(trimmed);
}

export function parseDepartmentsInput(value: string): string[] {
  return value
    .split(/[,/|·]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function formatDepartmentsInput(departments: string[] | null | undefined): string {
  return (departments ?? []).join(', ');
}

export { parseOperatingHoursText, formatOperatingHoursText };
