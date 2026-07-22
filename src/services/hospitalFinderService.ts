import { PORTAL_API_KEY } from '@/constants/env';
import {
  calculateDistanceMeters,
  EmergencyApiError,
  encodePortalServiceKey,
  estimateWalkMinutes,
  isMoonlightChildrenHospital,
  normalizeEmergencyApiRegion,
  safeDisplayText,
} from '@/services/emergencyApi';
import type { GeoCoordinate, LocationRegion } from '@/services/locationService';
import {
  getLocationWithRegionImmediate,
  refreshLocationCache,
  resolveRegionFromCoordinate,
} from '@/services/locationService';
import {
  buildFacilityMatchKey,
  normalizeFacilityName,
} from '@/services/localFacilityStore';
import {
  parseWeeklyDutySchedule,
  resolveHospitalOpenStatus,
  type HospitalDutyDay,
} from '@/utils/hospitalHours';

const HOSPITAL_FINDER_BASE = 'http://apis.data.go.kr/B552657/HsptlAsembySearchService';

const ENDPOINTS = {
  list: `${HOSPITAL_FINDER_BASE}/getHsptlMdcncListInfoInqire`,
  basis: `${HOSPITAL_FINDER_BASE}/getHsptlBasisListInfoInqire`,
  moonlightList: [
    `${HOSPITAL_FINDER_BASE}/getMoonltChldHsptlListInfoInqire`,
    `${HOSPITAL_FINDER_BASE}/getChldrnHsptlListInfoInqire`,
    `${HOSPITAL_FINDER_BASE}/getCncChildHsptlListInfoInqire`,
  ],
} as const;

const API_SUCCESS_CODE = '00';
const DEFAULT_PAGE_SIZE = 100;
const API_FETCH_TIMEOUT_MS = 12_000;
const PEDIATRIC_DEPT_CODE = 'D013';

export type HospitalFinderItem = {
  hpid: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  distanceKm: number;
  walkMin: number;
  facilityType: string;
  specialties: string[];
  weeklySchedule: HospitalDutyDay[];
  isMoonlightHospital: boolean;
  isPediatricCenter: boolean;
  isOpenNow: boolean;
  openStatusLabel: string;
  dutyStart?: string;
  description?: string;
  isPartner?: boolean;
  customMemo?: string;
  isCustomRecord?: boolean;
};

export type PediatricHospitalSearchOptions = {
  coordinate?: GeoCoordinate;
  region?: LocationRegion;
  maxResults?: number;
};

export type PediatricHospitalSearchResult = {
  success: boolean;
  items: HospitalFinderItem[];
  region: LocationRegion;
  errorMessage?: string;
};

function assertApiKey(): string {
  const key = PORTAL_API_KEY.trim();
  if (!key) {
    throw new EmergencyApiError(
      'EXPO_PUBLIC_PORTAL_API_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.',
    );
  }
  return key;
}

function buildPortalUrl(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): string {
  const serviceKey = encodePortalServiceKey(assertApiKey());
  const query = [`serviceKey=${serviceKey}`];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    query.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }

  return `${endpoint}?${query.join('&')}`;
}

async function fetchPortalRaw(url: string): Promise<{ rawText: string; contentType: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/xml, application/json, text/xml, */*' },
      signal: controller.signal,
    });
    const rawText = await response.text();
    if (!response.ok) {
      throw new EmergencyApiError(`병원찾기 API HTTP ${response.status} 오류`, undefined, response.status);
    }
    return { rawText, contentType: response.headers.get('content-type') };
  } catch (error) {
    if (error instanceof EmergencyApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new EmergencyApiError('병원찾기 API 응답 시간이 초과되었습니다.');
    }
    throw new EmergencyApiError(
      `병원찾기 API 요청 실패: ${error instanceof Error ? error.message : '네트워크 오류'}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function readXmlTag(block: string, tagName: string): string | undefined {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match?.[1]?.trim();
}

function readXmlHeader(xml: string): { resultCode: string; resultMsg: string } {
  return {
    resultCode: readXmlTag(xml, 'resultCode') ?? '',
    resultMsg: readXmlTag(xml, 'resultMsg') ?? readXmlTag(xml, 'resultMag') ?? '',
  };
}

function extractXmlItemBlocks(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
}

function readJsonString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value == null || value === '') continue;
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function readJsonHeader(payload: unknown): { resultCode: string; resultMsg: string } {
  const root = payload as Record<string, unknown>;
  const header =
    (root.response as Record<string, unknown> | undefined)?.header ?? root.header ?? {};
  return {
    resultCode: readJsonString(header as Record<string, unknown>, 'resultCode'),
    resultMsg: readJsonString(header as Record<string, unknown>, 'resultMsg', 'resultMag'),
  };
}

function unwrapJsonItems(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object') return [];

  const root = payload as Record<string, unknown>;
  const responseBody =
    (root.response as Record<string, unknown> | undefined)?.body ?? root.body ?? root;
  const body = responseBody as Record<string, unknown>;
  const itemsNode = body.items ?? body.item;

  if (itemsNode == null) {
    if ('hpid' in body || 'dutyName' in body || 'dutyname' in body) return [body];
    return [];
  }

  if (Array.isArray(itemsNode)) {
    return itemsNode.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object');
  }

  if (typeof itemsNode === 'object') {
    const node = itemsNode as Record<string, unknown>;
    const item = node.item;
    if (item == null) {
      if ('hpid' in node || 'dutyName' in node || 'dutyname' in node) return [node];
      return [];
    }
    if (Array.isArray(item)) {
      return item.filter((row): row is Record<string, unknown> => row != null && typeof row === 'object');
    }
    if (typeof item === 'object' && item !== null) return [item as Record<string, unknown>];
  }

  return [];
}

function parsePortalPayload(rawText: string, contentType: string | null): unknown {
  const trimmed = rawText.trim();
  const looksLikeJson =
    contentType?.includes('json') || trimmed.startsWith('{') || trimmed.startsWith('[');

  if (looksLikeJson) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      throw new EmergencyApiError('병원찾기 API JSON 파싱에 실패했습니다.');
    }
  }

  if (trimmed.startsWith('<')) return trimmed;
  throw new EmergencyApiError('병원찾기 API 응답 형식을 확인할 수 없습니다.');
}

function parseNumeric(value: string | number | undefined | null, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function assertApiSuccess(resultCode: string, resultMsg: string, context: string): void {
  if (resultCode && resultCode !== API_SUCCESS_CODE) {
    throw new EmergencyApiError(resultMsg || `${context} 오류 (resultCode: ${resultCode})`, resultCode);
  }
}

function collectDutyFieldsFromBlock(block: string): Record<string, string | undefined> {
  const fields: Record<string, string | undefined> = {};
  for (let dayCode = 1; dayCode <= 8; dayCode += 1) {
    fields[`dutyTime${dayCode}s`] = readXmlTag(block, `dutyTime${dayCode}s`);
    fields[`dutyTime${dayCode}c`] = readXmlTag(block, `dutyTime${dayCode}c`);
  }
  fields.dutyStart = readXmlTag(block, 'dutyStart');
  return fields;
}

function collectDutyFieldsFromRecord(record: Record<string, unknown>): Record<string, string | undefined> {
  const fields: Record<string, string | undefined> = {};
  for (let dayCode = 1; dayCode <= 8; dayCode += 1) {
    fields[`dutyTime${dayCode}s`] = readJsonString(record, `dutyTime${dayCode}s`);
    fields[`dutyTime${dayCode}c`] = readJsonString(record, `dutyTime${dayCode}c`);
  }
  fields.dutyStart = readJsonString(record, 'dutyStart');
  return fields;
}

function parseSpecialties(...values: Array<string | null | undefined>): string[] {
  const tags = new Set<string>();

  for (const value of values) {
    const raw = value?.trim();
    if (!raw) continue;

    raw
      .split(/[,/|·]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => tags.add(part));
  }

  return [...tags];
}

function mapHospitalFinderBlock(
  block: string,
  options: { forceMoonlight?: boolean; forcePediatric?: boolean } = {},
): HospitalFinderItem | null {
  const hpid = readXmlTag(block, 'hpid') ?? '';
  const name = readXmlTag(block, 'dutyName') ?? readXmlTag(block, 'dutyname') ?? '';
  const latitude = parseNumeric(readXmlTag(block, 'wgs84Lat'));
  const longitude = parseNumeric(readXmlTag(block, 'wgs84Lon'));
  const dutyFields = collectDutyFieldsFromBlock(block);
  const weeklySchedule = parseWeeklyDutySchedule(dutyFields);
  const openStatus = resolveHospitalOpenStatus(weeklySchedule);
  const specialties = parseSpecialties(
    readXmlTag(block, 'dgsbjtCdNm'),
    readXmlTag(block, 'dutyDivNam'),
    readXmlTag(block, 'dutyDiv'),
  );

  const isMoonlight =
    options.forceMoonlight ||
    isMoonlightChildrenHospital(name) ||
    (readXmlTag(block, 'moonlightYn') ?? '').toUpperCase() === 'Y';

  const isPediatric =
    options.forcePediatric ||
    isMoonlight ||
    specialties.some((tag) => tag.includes('소아')) ||
    (readXmlTag(block, 'dgsbjtCdNm') ?? '').includes('소아');

  if (!hpid && !name) return null;

  return {
    hpid: hpid || buildFacilityMatchKey(name, readXmlTag(block, 'dutyAddr') ?? ''),
    name: safeDisplayText(name, '병원'),
    address: safeDisplayText(readXmlTag(block, 'dutyAddr'), '주소 정보 없음'),
    phone: safeDisplayText(readXmlTag(block, 'dutyTel1') ?? readXmlTag(block, 'dutyTel3'), '-'),
    latitude,
    longitude,
    distanceM: 0,
    distanceKm: 0,
    walkMin: 0,
    facilityType: safeDisplayText(readXmlTag(block, 'dutyDivNam') ?? readXmlTag(block, 'dutyDiv'), '의료기관'),
    specialties,
    weeklySchedule,
    isMoonlightHospital: isMoonlight,
    isPediatricCenter: isPediatric,
    isOpenNow: openStatus.isOpenNow,
    openStatusLabel: openStatus.label,
    dutyStart: dutyFields.dutyStart,
    description: readXmlTag(block, 'dutyInf') ?? readXmlTag(block, 'dutyEryn'),
  };
}

function mapHospitalFinderRecord(
  record: Record<string, unknown>,
  options: { forceMoonlight?: boolean; forcePediatric?: boolean } = {},
): HospitalFinderItem | null {
  const hpid = readJsonString(record, 'hpid');
  const name = readJsonString(record, 'dutyName', 'dutyname');
  const latitude = parseNumeric(readJsonString(record, 'wgs84Lat'));
  const longitude = parseNumeric(readJsonString(record, 'wgs84Lon'));
  const dutyFields = collectDutyFieldsFromRecord(record);
  const weeklySchedule = parseWeeklyDutySchedule(dutyFields);
  const openStatus = resolveHospitalOpenStatus(weeklySchedule);
  const specialties = parseSpecialties(
    readJsonString(record, 'dgsbjtCdNm'),
    readJsonString(record, 'dutyDivNam'),
    readJsonString(record, 'dutyDiv'),
  );

  const isMoonlight =
    options.forceMoonlight ||
    isMoonlightChildrenHospital(name) ||
    readJsonString(record, 'moonlightYn').toUpperCase() === 'Y';

  const isPediatric =
    options.forcePediatric ||
    isMoonlight ||
    specialties.some((tag) => tag.includes('소아')) ||
    readJsonString(record, 'dgsbjtCdNm').includes('소아');

  if (!hpid && !name) return null;

  return {
    hpid: hpid || buildFacilityMatchKey(name, readJsonString(record, 'dutyAddr')),
    name: safeDisplayText(name, '병원'),
    address: safeDisplayText(readJsonString(record, 'dutyAddr'), '주소 정보 없음'),
    phone: safeDisplayText(readJsonString(record, 'dutyTel1', 'dutyTel3'), '-'),
    latitude,
    longitude,
    distanceM: 0,
    distanceKm: 0,
    walkMin: 0,
    facilityType: safeDisplayText(readJsonString(record, 'dutyDivNam', 'dutyDiv'), '의료기관'),
    specialties,
    weeklySchedule,
    isMoonlightHospital: isMoonlight,
    isPediatricCenter: isPediatric,
    isOpenNow: openStatus.isOpenNow,
    openStatusLabel: openStatus.label,
    dutyStart: dutyFields.dutyStart,
    description: readJsonString(record, 'dutyInf', 'dutyEryn'),
  };
}

function parseHospitalFinderResponse(
  rawText: string,
  contentType: string | null,
  options?: { forceMoonlight?: boolean; forcePediatric?: boolean },
): HospitalFinderItem[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '병원찾기 API');
    return extractXmlItemBlocks(payload)
      .map((block) => mapHospitalFinderBlock(block, options))
      .filter((item): item is HospitalFinderItem => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '병원찾기 API');
  return unwrapJsonItems(payload)
    .map((record) => mapHospitalFinderRecord(record, options))
    .filter((item): item is HospitalFinderItem => item !== null);
}

async function fetchAllPages(
  buildPageUrl: (pageNo: number, numOfRows: number) => string,
  parsePage: (rawText: string, contentType: string | null) => HospitalFinderItem[],
  maxPages = 5,
): Promise<HospitalFinderItem[]> {
  const first = await fetchPortalRaw(buildPageUrl(1, DEFAULT_PAGE_SIZE));
  const firstItems = parsePage(first.rawText, first.contentType);
  const payload = parsePortalPayload(first.rawText, first.contentType);

  let totalCount = firstItems.length;
  if (typeof payload === 'string') {
    totalCount = parseNumeric(readXmlTag(payload, 'totalCount'), firstItems.length);
  } else {
    const body = ((payload as Record<string, unknown>).response as Record<string, unknown> | undefined)
      ?.body as Record<string, unknown> | undefined;
    totalCount = parseNumeric(readJsonString(body ?? {}, 'totalCount'), firstItems.length);
  }

  const allItems = [...firstItems];
  const totalPages = Math.min(Math.ceil(totalCount / DEFAULT_PAGE_SIZE), maxPages);

  for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
    const page = await fetchPortalRaw(buildPageUrl(pageNo, DEFAULT_PAGE_SIZE));
    allItems.push(...parsePage(page.rawText, page.contentType));
  }

  return allItems;
}

async function resolveSearchContext(options?: PediatricHospitalSearchOptions): Promise<{
  coordinate: GeoCoordinate;
  region: LocationRegion;
}> {
  if (options?.coordinate && options?.region) {
    return { coordinate: options.coordinate, region: normalizeEmergencyApiRegion(options.region) };
  }

  if (options?.coordinate) {
    const region = normalizeEmergencyApiRegion(await resolveRegionFromCoordinate(options.coordinate));
    return { coordinate: options.coordinate, region };
  }

  const location = getLocationWithRegionImmediate();
  void refreshLocationCache();

  if (options?.region) {
    return { coordinate: location.coordinate, region: normalizeEmergencyApiRegion(options.region) };
  }

  return {
    coordinate: location.coordinate,
    region: normalizeEmergencyApiRegion(location.region),
  };
}

function withDistance(
  items: HospitalFinderItem[],
  coordinate: GeoCoordinate,
): HospitalFinderItem[] {
  return items.map((item) => {
    if (item.latitude === 0 && item.longitude === 0) {
      return item;
    }
    const distanceM = calculateDistanceMeters(coordinate, {
      latitude: item.latitude,
      longitude: item.longitude,
    });
    return {
      ...item,
      distanceM,
      distanceKm: Math.round((distanceM / 1000) * 10) / 10,
      walkMin: estimateWalkMinutes(distanceM),
    };
  });
}

export function sortPediatricHospitals(items: HospitalFinderItem[]): HospitalFinderItem[] {
  const moonlight: HospitalFinderItem[] = [];
  const pediatric: HospitalFinderItem[] = [];
  const regular: HospitalFinderItem[] = [];

  for (const item of items) {
    if (item.isMoonlightHospital) {
      moonlight.push(item);
    } else if (item.isPediatricCenter) {
      pediatric.push(item);
    } else {
      regular.push(item);
    }
  }

  const byDistance = (a: HospitalFinderItem, b: HospitalFinderItem) => a.distanceM - b.distanceM;
  moonlight.sort(byDistance);
  pediatric.sort(byDistance);
  regular.sort(byDistance);

  return [...moonlight, ...pediatric, ...regular];
}

function dedupeHospitals(items: HospitalFinderItem[]): HospitalFinderItem[] {
  const map = new Map<string, HospitalFinderItem>();

  for (const item of items) {
    const key = item.hpid || buildFacilityMatchKey(item.name, item.address);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }

    map.set(key, {
      ...existing,
      ...item,
      isMoonlightHospital: existing.isMoonlightHospital || item.isMoonlightHospital,
      isPediatricCenter: existing.isPediatricCenter || item.isPediatricCenter,
      specialties: [...new Set([...existing.specialties, ...item.specialties])],
      weeklySchedule: item.weeklySchedule.some((day) => !day.closed)
        ? item.weeklySchedule
        : existing.weeklySchedule,
      isOpenNow: item.isOpenNow || existing.isOpenNow,
      openStatusLabel: item.isOpenNow ? item.openStatusLabel : existing.openStatusLabel,
    });
  }

  return [...map.values()];
}

async function fetchHospitalListByRegion(
  region: LocationRegion,
  extraParams: Record<string, string | number | undefined> = {},
  parseOptions?: { forceMoonlight?: boolean; forcePediatric?: boolean },
): Promise<HospitalFinderItem[]> {
  return fetchAllPages(
    (pageNo, numOfRows) =>
      buildPortalUrl(ENDPOINTS.list, {
        Q0: region.stage1,
        Q1: region.stage2 || undefined,
        pageNo,
        numOfRows,
        ...extraParams,
      }),
    (raw, type) => parseHospitalFinderResponse(raw, type, parseOptions),
  );
}

async function fetchMoonlightHospitalsByRegion(region: LocationRegion): Promise<HospitalFinderItem[]> {
  for (const endpoint of ENDPOINTS.moonlightList) {
    try {
      const items = await fetchAllPages(
        (pageNo, numOfRows) =>
          buildPortalUrl(endpoint, {
            Q0: region.stage1,
            Q1: region.stage2 || undefined,
            pageNo,
            numOfRows,
          }),
        (raw, type) => parseHospitalFinderResponse(raw, type, { forceMoonlight: true }),
        3,
      );
      if (items.length > 0) return items;
    } catch (error) {
      if (__DEV__) {
        console.warn('[HospitalFinder] moonlight endpoint failed', endpoint, error);
      }
    }
  }

  const fallback = await fetchHospitalListByRegion(region, { QN: '달빛' }, { forceMoonlight: true });
  return fallback.filter((item) => item.isMoonlightHospital);
}

export async function fetchPediatricHospitals(
  options: PediatricHospitalSearchOptions = {},
): Promise<PediatricHospitalSearchResult> {
  const { coordinate, region } = await resolveSearchContext(options);
  const maxResults = options.maxResults ?? 80;

  try {
    const [moonlightRows, pediatricRows] = await Promise.all([
      fetchMoonlightHospitalsByRegion(region).catch((error) => {
        console.error('[HospitalFinder] moonlight fetch failed', error);
        return [] as HospitalFinderItem[];
      }),
      fetchHospitalListByRegion(region, { QD: PEDIATRIC_DEPT_CODE }, { forcePediatric: true }).catch(
        (error) => {
          console.error('[HospitalFinder] pediatric list fetch failed', error);
          return [] as HospitalFinderItem[];
        },
      ),
    ]);

    const merged = dedupeHospitals([...moonlightRows, ...pediatricRows]);
    const withCoords = withDistance(merged, coordinate);
    const sorted = sortPediatricHospitals(withCoords).slice(0, maxResults);

    if (__DEV__) {
      console.log('[HospitalFinder] fetchPediatricHospitals', {
        region: region.label,
        moonlight: moonlightRows.length,
        pediatric: pediatricRows.length,
        merged: sorted.length,
      });
    }

    return { success: true, items: sorted, region };
  } catch (error) {
    const errorMessage =
      error instanceof EmergencyApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : '소아 의료기관 정보를 불러오지 못했습니다.';

    console.error('[HospitalFinder] fetchPediatricHospitals failed', { region: region.label, errorMessage });

    return {
      success: false,
      items: [],
      region,
      errorMessage,
    };
  }
}

export async function fetchHospitalFinderDetail(hpid: string): Promise<HospitalFinderItem | null> {
  if (!hpid.trim()) return null;

  try {
    const url = buildPortalUrl(ENDPOINTS.basis, { HPID: hpid, pageNo: 1, numOfRows: 1 });
    const { rawText, contentType } = await fetchPortalRaw(url);
    const [item] = parseHospitalFinderResponse(rawText, contentType);
    return item ?? null;
  } catch (error) {
    console.error('[HospitalFinder] fetchHospitalFinderDetail failed', { hpid, error });
    return null;
  }
}

export type HospitalMetadataEntry = {
  hpid: string;
  name: string;
  specialties: string[];
  weeklySchedule: HospitalDutyDay[];
  isOpenNow: boolean;
  openStatusLabel: string;
};

/** 응급실 탭 리스트 카드용 지역 병원 메타데이터(진료시간·과목) 인덱스 */
export async function fetchRegionalHospitalMetadataIndex(
  region: LocationRegion,
): Promise<Map<string, HospitalMetadataEntry>> {
  const index = new Map<string, HospitalMetadataEntry>();
  const normalizedRegion = normalizeEmergencyApiRegion(region);

  try {
    const items = await fetchHospitalListByRegion(normalizedRegion);
    for (const item of items) {
      const entry: HospitalMetadataEntry = {
        hpid: item.hpid,
        name: item.name,
        specialties: item.specialties,
        weeklySchedule: item.weeklySchedule,
        isOpenNow: item.isOpenNow,
        openStatusLabel: item.openStatusLabel,
      };

      if (item.hpid) {
        index.set(`hpid:${item.hpid}`, entry);
      }
      index.set(`key:${buildFacilityMatchKey(item.name, item.address)}`, entry);
      const nameKey = normalizeFacilityName(item.name);
      if (nameKey && !index.has(`name:${nameKey}`)) {
        index.set(`name:${nameKey}`, entry);
      }
    }
  } catch (error) {
    console.error('[HospitalFinder] fetchRegionalHospitalMetadataIndex failed', {
      region: normalizedRegion.label,
      error,
    });
  }

  return index;
}
