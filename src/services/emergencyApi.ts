import type { HospitalDutyDay } from '@/utils/hospitalHours';
import { parseWeeklyDutySchedule, resolveHospitalOpenStatus } from '@/utils/hospitalHours';
import { PORTAL_API_KEY } from '@/constants/env';
import type { ErStatus } from '@/mockData/aedAndEmergency';
import { searchHazardousMaterials } from '@/mockData/hazardousMaterials';
import type { GeoCoordinate, LocationRegion } from '@/services/locationService';
import {
  getDefaultRegion,
  getLocationWithRegionImmediate,
  matchesAddressQuery,
  refreshLocationCache,
  resolveRegionCandidatesFromAddressQuery,
  resolveRegionFromCoordinate,
} from '@/services/locationService';

const ERMCT_BASE = 'http://apis.data.go.kr/B552657/ErmctInfoInqireService';
const AED_BASE = 'http://apis.data.go.kr/B552657/AEDInfoInqireService';
const DRUG_BASE = 'http://apis.data.go.kr/1471000/DrbEasyDrugInfoService';
const PHARMACY_BASE = 'http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService';
const TOXIC_BASE = 'http://apis.data.go.kr/1480802/iciskischem';

const EMERGENCY_BED_ENDPOINT = `${ERMCT_BASE}/getEmrrmRltmUsefulSckbdInfoInqire`;
const HOSPITAL_LOCATION_ENDPOINT = `${ERMCT_BASE}/getEgytListInfoInqire`;
const HOSPITAL_BASIS_ENDPOINT = `${ERMCT_BASE}/getEgytBassInfoInqire`;
const AED_LOCATION_ENDPOINT = `${AED_BASE}/getAedLcinfoInqire`;
const DRUG_SEARCH_ENDPOINT = `${DRUG_BASE}/getDrbEasyDrugList`;
const PHARMACY_LIST_ENDPOINT = `${PHARMACY_BASE}/getParmacyListInfoInqire`;
const PHARMACY_LOCATION_ENDPOINT = `${PHARMACY_BASE}/getParmacyLcinfoInqire`;
const TOXIC_SEARCH_ENDPOINT = `${TOXIC_BASE}/kischemlist`;

const API_SUCCESS_CODE = '00';
const DEFAULT_RADIUS_METERS = 15_000;
const DEFAULT_AED_RADIUS_METERS = 5_000;
const DEFAULT_PAGE_SIZE = 100;

export type EmergencyBedQuery = {
  stage1: string;
  stage2: string;
  pageNo?: number;
  numOfRows?: number;
};

export const DEFAULT_EMERGENCY_REGION = {
  stage1: '서울특별시',
  stage2: '',
  label: '서울특별시',
} as const;

export type EmergencyBedItem = {
  rnum: number;
  hpid: string;
  phpid: string;
  hospitalName: string;
  erPhone: string;
  updatedAt: string;
  availableErBeds: number;
  availablePediatricErBeds: number;
  availableSurgeryBeds: number;
  availableNeuroIcuBeds: number;
  availableNeonatalIcuBeds: number;
  availableChestIcuBeds: number;
  availableGeneralIcuBeds: number;
  availableInpatientBeds: number;
  onCallDoctor: string;
  ctAvailable: boolean;
  mriAvailable: boolean;
  angioAvailable: boolean;
  ventilatorAvailable: boolean;
  ambulanceAvailable: boolean;
  erDoctorPhone: string;
  pediatricDoctorPhone: string;
  status: ErStatus;
  icuInternalMedicineBeds: number;
  icuSurgeryBeds: number;
  icuOrthopedicBeds: number;
  icuNeurologyBeds: number;
  icuNeurosurgeryBeds: number;
  icuToxicologyBeds: number;
  icuBurnBeds: number;
  icuTraumaBeds: number;
  pediatricVentilatorAvailable: boolean;
  incubatorAvailable: boolean;
};

export type HospitalLocationItem = {
  hpid: string;
  hospitalName: string;
  address: string;
  erPhone: string;
  phone: string;
  latitude: number;
  longitude: number;
  emergencyClass: string;
  emergencyClassName: string;
  /** dutyInf — 기관설명 */
  description?: string;
};

export type NearbyHospital = EmergencyBedItem &
  HospitalLocationItem & {
    distanceM: number;
    distanceKm: number;
    walkMin: number;
    isPediatricPriority: boolean;
    isMoonlightHospital: boolean;
  };

export type AedLocationItem = {
  serialSeq: string;
  org: string;
  buildAddress: string;
  buildPlace: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  walkMin: number;
  model: string;
  manufacturer: string;
  managerTel: string;
  clerkTel: string;
  available24h: boolean;
};

export type MedicineInfo = {
  itemName: string;
  entpName: string;
  itemSeq: string;
  itemImage: string;
  efficacy: string;
  usage: string;
  warningBeforeUse: string;
  precautions: string;
  interactions: string;
  sideEffects: string;
  storage: string;
  updatedAt: string;
};

export type MedicineBrowseOptions = {
  pageNo?: number;
  numOfRows?: number;
  itemName?: string;
};

export type EmergencyBedResponse = {
  resultCode: string;
  resultMsg: string;
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  items: EmergencyBedItem[];
};

export type NearbyHospitalOptions = {
  coordinate?: GeoCoordinate;
  region?: LocationRegion;
  radiusMeters?: number;
  maxResults?: number;
};

export type AedListOptions = {
  coordinate?: GeoCoordinate;
  region?: LocationRegion;
  /** 지역명 검색 (예: '목포', '서울') — 있으면 GPS 대신 주소 기반 조회 */
  addressQuery?: string;
  /** 클릭한 마커 좌표 — 상세 조회 시 해당 지역 API 페이지 탐색에 사용 */
  markerCoordinate?: GeoCoordinate;
  radiusMeters?: number;
  maxResults?: number;
};

export type MedicineSearchOptions = {
  itemName: string;
  pageNo?: number;
  numOfRows?: number;
};

export type PharmacyInfo = {
  hpid: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  distanceKm: number;
  walkMin: number;
  dutyTimeStart: string;
  dutyTimeEnd: string;
  isOpenNow: boolean;
  treatmentDayLabel: string;
};

export type NearbyPharmacyOptions = {
  coordinate?: GeoCoordinate;
  region?: LocationRegion;
  radiusMeters?: number;
  maxResults?: number;
  /** true면 공휴일/주말 운영 약국 우선 (휴일지킴이) */
  holidayKeeper?: boolean;
};

export type ToxicSubstanceInfo = {
  dataNo: string;
  nameKo: string;
  nameEn: string;
  casNo: string;
  generalSymptoms: string;
  inhalation: string;
  skin: string;
  eye: string;
  oral: string;
  other: string;
  /** 흡입/경구 등 노출 경로별 응급처치 요약 */
  emergencyTreatment: string;
  source: 'api' | 'mock';
};

export type ToxicSubstanceSearchOptions = {
  query: string;
  pageNo?: number;
  numOfRows?: number;
};

export class EmergencyApiError extends Error {
  constructor(
    message: string,
    readonly resultCode?: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'EmergencyApiError';
  }
}

function assertApiKey(): string {
  const key = PORTAL_API_KEY.trim();
  if (!key) {
    throw new EmergencyApiError(
      'EXPO_PUBLIC_PORTAL_API_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.',
    );
  }
  return key;
}

export function encodePortalServiceKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  try {
    return encodeURIComponent(decodeURIComponent(trimmed));
  } catch {
    return encodeURIComponent(trimmed);
  }
}

function encodeQueryValue(value: string | number): string {
  return encodeURIComponent(String(value));
}

function buildPortalUrl(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): string {
  const serviceKey = encodePortalServiceKey(assertApiKey());
  const query = [`serviceKey=${serviceKey}`];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    query.push(`${encodeURIComponent(key)}=${encodeQueryValue(value)}`);
  }

  return `${endpoint}?${query.join('&')}`;
}

export function buildEmergencyBedUrl(query: EmergencyBedQuery): string {
  return buildPortalUrl(EMERGENCY_BED_ENDPOINT, {
    STAGE1: query.stage1,
    STAGE2: query.stage2,
    pageNo: query.pageNo ?? 1,
    numOfRows: query.numOfRows ?? DEFAULT_PAGE_SIZE,
  });
}

const API_FETCH_TIMEOUT_MS = 12_000;

async function fetchPortalRaw(url: string): Promise<{ rawText: string; contentType: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/xml, application/json, text/xml, */*',
      },
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '네트워크 오류';
    if (error instanceof Error && error.name === 'AbortError') {
      throw new EmergencyApiError('공공 API 응답 시간이 초과되었습니다. 네트워크를 확인해 주세요.');
    }
    throw new EmergencyApiError(`공공 API 요청 실패: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  const rawText = await response.text();

  if (!response.ok) {
    throw new EmergencyApiError(
      `공공 API HTTP ${response.status} 오류`,
      undefined,
      response.status,
    );
  }

  return { rawText, contentType: response.headers.get('content-type') };
}

function parseNumeric(value: string | number | undefined | null, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const trimmed = String(value).trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** 응급실 API 병상 수 — 미신고/센티널 값(999 등)은 0으로 처리 */
export function parseBedCount(value: string | number | undefined | null): number {
  if (value == null) return 0;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '-' || trimmed === '미신고' || trimmed === 'null') return 0;

  const parsed = parseNumeric(value, -1);
  if (parsed < 0 || parsed === 999 || parsed === 9999 || parsed === 99) return 0;
  return Math.floor(parsed);
}

/** E-Gen API STAGE1/STAGE2 파라미터 정규화 */
export function normalizeEmergencyApiRegion(region: LocationRegion): LocationRegion {
  const stage1 = normalizeSido(region.stage1?.trim() || DEFAULT_EMERGENCY_REGION.stage1);
  let stage2 = region.stage2?.trim() || '';

  if (stage2.startsWith(stage1)) {
    stage2 = stage2.slice(stage1.length).trim();
  }

  if (stage1 === '세종특별자치시' && !stage2) {
    stage2 = '세종특별자치시';
  }

  const label = stage2 ? `${stage1} ${stage2}` : stage1;
  return { stage1, stage2, label };
}

function normalizeSido(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_EMERGENCY_REGION.stage1;

  const SIDO_SUFFIXES = ['특별자치도', '특별자치시', '특별시', '광역시', '자치시', '도'] as const;
  if (SIDO_SUFFIXES.some((suffix) => trimmed.endsWith(suffix))) return trimmed;

  const SIDO_ALIAS_MAP: Record<string, string> = {
    서울: '서울특별시',
    부산: '부산광역시',
    대구: '대구광역시',
    인천: '인천광역시',
    광주: '광주광역시',
    대전: '대전광역시',
    울산: '울산광역시',
    세종: '세종특별자치시',
    경기: '경기도',
    강원: '강원특별자치도',
    충북: '충청북도',
    충남: '충청남도',
    전북: '전북특별자치도',
    전남: '전라남도',
    경북: '경상북도',
    경남: '경상남도',
    제주: '제주특별자치도',
  };

  for (const [key, value] of Object.entries(SIDO_ALIAS_MAP)) {
    if (trimmed.startsWith(key)) return value;
  }

  return trimmed;
}

export function parseYesNo(value: string | undefined | null): boolean {
  if (value == null) return false;
  const normalized = String(value).trim().toUpperCase();
  return normalized === 'Y' || normalized === 'Y1';
}

function deriveErStatus(availableErBeds: number): ErStatus {
  const beds = Number.isFinite(availableErBeds) ? availableErBeds : 0;
  if (beds <= 0) return 'full';
  if (beds <= 3) return 'congested';
  return 'available';
}

/** UI 표시용 — null/undefined/NaN 안전 */
export function formatCount(value: number | null | undefined, fallback = '-'): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  return String(value);
}

export function safeErStatus(status: ErStatus | null | undefined): ErStatus {
  if (status === 'available' || status === 'congested' || status === 'full') return status;
  return 'full';
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

function assertApiSuccess(resultCode: string, resultMsg: string, context: string): void {
  if (resultCode && resultCode !== API_SUCCESS_CODE) {
    throw new EmergencyApiError(
      resultMsg || `${context} 오류 (resultCode: ${resultCode})`,
      resultCode,
    );
  }
}

function extractXmlItemBlocks(xml: string): string[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
}

function unwrapJsonItems(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object') return [];

  const root = payload as Record<string, unknown>;
  const responseBody =
    (root.response as Record<string, unknown> | undefined)?.body ??
    root.body ??
    root;

  const body = responseBody as Record<string, unknown>;
  const itemsNode = body.items ?? body.item;

  if (itemsNode == null) {
    if ('hpid' in body || 'serialSeq' in body || 'dutyName' in body || 'dutyname' in body) {
      return [body];
    }
    return [];
  }

  if (Array.isArray(itemsNode)) {
    return itemsNode.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object');
  }

  if (typeof itemsNode === 'object') {
    const node = itemsNode as Record<string, unknown>;
    const item = node.item;

    if (item == null) {
      if ('hpid' in node || 'serialSeq' in node || 'dutyName' in node || 'dutyname' in node) {
        return [node];
      }
      return [];
    }

    if (Array.isArray(item)) {
      return item.filter((row): row is Record<string, unknown> => row != null && typeof row === 'object');
    }
    if (typeof item === 'object' && item !== null) {
      return [item as Record<string, unknown>];
    }
  }

  return [];
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
    (root.response as Record<string, unknown> | undefined)?.header ??
    root.header ??
    {};

  return {
    resultCode: readJsonString(header as Record<string, unknown>, 'resultCode'),
    resultMsg: readJsonString(header as Record<string, unknown>, 'resultMsg', 'resultMag'),
  };
}

function parsePortalPayload(rawText: string, contentType: string | null): unknown {
  const trimmed = rawText.trim();
  const looksLikeJson =
    contentType?.includes('json') || trimmed.startsWith('{') || trimmed.startsWith('[');

  if (looksLikeJson) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      throw new EmergencyApiError('공공 API JSON 응답 파싱에 실패했습니다.');
    }
  }

  if (trimmed.startsWith('<')) {
    return trimmed;
  }

  throw new EmergencyApiError('공공 API 응답 형식을 확인할 수 없습니다.');
}

function sanitizeEmergencyBedItem(item: EmergencyBedItem): EmergencyBedItem {
  const availableErBeds = parseBedCount(item.availableErBeds);
  return {
    ...item,
    rnum: parseNumeric(item.rnum),
    hpid: item.hpid || '',
    phpid: item.phpid || item.hpid || '',
    hospitalName: item.hospitalName || '병원명 미상',
    erPhone: item.erPhone || '',
    updatedAt: item.updatedAt || '',
    availableErBeds,
    availablePediatricErBeds: parseBedCount(item.availablePediatricErBeds),
    availableSurgeryBeds: parseBedCount(item.availableSurgeryBeds),
    availableNeuroIcuBeds: parseBedCount(item.availableNeuroIcuBeds),
    availableNeonatalIcuBeds: parseBedCount(item.availableNeonatalIcuBeds),
    availableChestIcuBeds: parseBedCount(item.availableChestIcuBeds),
    availableGeneralIcuBeds: parseBedCount(item.availableGeneralIcuBeds),
    availableInpatientBeds: parseBedCount(item.availableInpatientBeds),
    onCallDoctor: item.onCallDoctor || '',
    ctAvailable: Boolean(item.ctAvailable),
    mriAvailable: Boolean(item.mriAvailable),
    angioAvailable: Boolean(item.angioAvailable),
    ventilatorAvailable: Boolean(item.ventilatorAvailable),
    ambulanceAvailable: Boolean(item.ambulanceAvailable),
    erDoctorPhone: item.erDoctorPhone || '',
    pediatricDoctorPhone: item.pediatricDoctorPhone || '',
    status: deriveErStatus(availableErBeds),
    icuInternalMedicineBeds: parseBedCount(item.icuInternalMedicineBeds),
    icuSurgeryBeds: parseBedCount(item.icuSurgeryBeds),
    icuOrthopedicBeds: parseBedCount(item.icuOrthopedicBeds),
    icuNeurologyBeds: parseBedCount(item.icuNeurologyBeds),
    icuNeurosurgeryBeds: parseBedCount(item.icuNeurosurgeryBeds),
    icuToxicologyBeds: parseBedCount(item.icuToxicologyBeds),
    icuBurnBeds: parseBedCount(item.icuBurnBeds),
    icuTraumaBeds: parseBedCount(item.icuTraumaBeds),
    pediatricVentilatorAvailable: Boolean(item.pediatricVentilatorAvailable),
    incubatorAvailable: Boolean(item.incubatorAvailable),
  };
}

function mapEmergencyBedBlock(block: string): EmergencyBedItem {
  return sanitizeEmergencyBedItem({
    rnum: parseNumeric(readXmlTag(block, 'rnum')),
    hpid: readXmlTag(block, 'hpid') ?? '',
    phpid: readXmlTag(block, 'phpid') ?? '',
    hospitalName: readXmlTag(block, 'dutyName') ?? readXmlTag(block, 'dutyname') ?? '',
    erPhone: readXmlTag(block, 'dutyTel3') ?? readXmlTag(block, 'dutytel3') ?? '',
    updatedAt: readXmlTag(block, 'hvidate') ?? '',
    availableErBeds: parseBedCount(readXmlTag(block, 'hvec')),
    availablePediatricErBeds: parseBedCount(readXmlTag(block, 'hvle')),
    availableSurgeryBeds: parseBedCount(readXmlTag(block, 'hvoc')),
    availableNeuroIcuBeds: parseBedCount(readXmlTag(block, 'hvcc')),
    availableNeonatalIcuBeds: parseBedCount(readXmlTag(block, 'hvncc')),
    availableChestIcuBeds: parseBedCount(readXmlTag(block, 'hvccc')),
    availableGeneralIcuBeds: parseBedCount(readXmlTag(block, 'hvicc')),
    availableInpatientBeds: parseBedCount(readXmlTag(block, 'hvgc')),
    onCallDoctor: readXmlTag(block, 'hvdnm') ?? '',
    ctAvailable: parseYesNo(readXmlTag(block, 'hvctayn')),
    mriAvailable: parseYesNo(readXmlTag(block, 'hvmriayn')),
    angioAvailable: parseYesNo(readXmlTag(block, 'hvangioayn')),
    ventilatorAvailable: parseYesNo(readXmlTag(block, 'hvventiayn')),
    ambulanceAvailable: parseYesNo(readXmlTag(block, 'hvamyn')),
    erDoctorPhone:
      readXmlTag(block, 'hv120') ?? readXmlTag(block, 'hv1') ?? '',
    pediatricDoctorPhone:
      readXmlTag(block, 'hv122') ?? readXmlTag(block, 'hv12') ?? '',
    status: 'full',
    icuInternalMedicineBeds: parseBedCount(readXmlTag(block, 'hv2')),
    icuSurgeryBeds: parseBedCount(readXmlTag(block, 'hv3')),
    icuOrthopedicBeds: parseBedCount(readXmlTag(block, 'hv4')),
    icuNeurologyBeds: parseBedCount(readXmlTag(block, 'hv5')),
    icuNeurosurgeryBeds: parseBedCount(readXmlTag(block, 'hv6')),
    icuToxicologyBeds: parseBedCount(readXmlTag(block, 'hv7')),
    icuBurnBeds: parseBedCount(readXmlTag(block, 'hv8')),
    icuTraumaBeds: parseBedCount(readXmlTag(block, 'hv9')),
    pediatricVentilatorAvailable: parseYesNo(readXmlTag(block, 'hv10')),
    incubatorAvailable: parseYesNo(readXmlTag(block, 'hv11')),
  });
}

function mapEmergencyBedRecord(record: Record<string, unknown>): EmergencyBedItem {
  return sanitizeEmergencyBedItem({
    rnum: parseNumeric(readJsonString(record, 'rnum')),
    hpid: readJsonString(record, 'hpid'),
    phpid: readJsonString(record, 'phpid'),
    hospitalName: readJsonString(record, 'dutyName', 'dutyname'),
    erPhone: readJsonString(record, 'dutyTel3', 'dutytel3'),
    updatedAt: readJsonString(record, 'hvidate'),
    availableErBeds: parseBedCount(readJsonString(record, 'hvec')),
    availablePediatricErBeds: parseBedCount(readJsonString(record, 'hvle')),
    availableSurgeryBeds: parseBedCount(readJsonString(record, 'hvoc')),
    availableNeuroIcuBeds: parseBedCount(readJsonString(record, 'hvcc')),
    availableNeonatalIcuBeds: parseBedCount(readJsonString(record, 'hvncc')),
    availableChestIcuBeds: parseBedCount(readJsonString(record, 'hvccc')),
    availableGeneralIcuBeds: parseBedCount(readJsonString(record, 'hvicc')),
    availableInpatientBeds: parseBedCount(readJsonString(record, 'hvgc')),
    onCallDoctor: readJsonString(record, 'hvdnm'),
    ctAvailable: parseYesNo(readJsonString(record, 'hvctayn')),
    mriAvailable: parseYesNo(readJsonString(record, 'hvmriayn')),
    angioAvailable: parseYesNo(readJsonString(record, 'hvangioayn')),
    ventilatorAvailable: parseYesNo(readJsonString(record, 'hvventiayn')),
    ambulanceAvailable: parseYesNo(readJsonString(record, 'hvamyn')),
    erDoctorPhone:
      readJsonString(record, 'hv120', 'hv1') || '',
    pediatricDoctorPhone:
      readJsonString(record, 'hv122', 'hv12') || '',
    status: 'full',
    icuInternalMedicineBeds: parseBedCount(readJsonString(record, 'hv2')),
    icuSurgeryBeds: parseBedCount(readJsonString(record, 'hv3')),
    icuOrthopedicBeds: parseBedCount(readJsonString(record, 'hv4')),
    icuNeurologyBeds: parseBedCount(readJsonString(record, 'hv5')),
    icuNeurosurgeryBeds: parseBedCount(readJsonString(record, 'hv6')),
    icuToxicologyBeds: parseBedCount(readJsonString(record, 'hv7')),
    icuBurnBeds: parseBedCount(readJsonString(record, 'hv8')),
    icuTraumaBeds: parseBedCount(readJsonString(record, 'hv9')),
    pediatricVentilatorAvailable: parseYesNo(readJsonString(record, 'hv10')),
    incubatorAvailable: parseYesNo(readJsonString(record, 'hv11')),
  });
}

function parseEmergencyBedResponse(rawText: string, contentType: string | null): EmergencyBedResponse {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '응급실 API');
    const items = extractXmlItemBlocks(payload).map(mapEmergencyBedBlock);

    return {
      resultCode,
      resultMsg,
      pageNo: parseNumeric(readXmlTag(payload, 'pageNo'), 1),
      numOfRows: parseNumeric(readXmlTag(payload, 'numOfRows'), items.length),
      totalCount: parseNumeric(readXmlTag(payload, 'totalCount'), items.length),
      items,
    };
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '응급실 API');
  const items = unwrapJsonItems(payload).map(mapEmergencyBedRecord);
  const body = ((payload as Record<string, unknown>).response as Record<string, unknown> | undefined)
    ?.body as Record<string, unknown> | undefined;

  return {
    resultCode,
    resultMsg,
    pageNo: parseNumeric(readJsonString(body ?? {}, 'pageNo'), 1),
    numOfRows: parseNumeric(readJsonString(body ?? {}, 'numOfRows'), items.length),
    totalCount: parseNumeric(readJsonString(body ?? {}, 'totalCount'), items.length),
    items,
  };
}

function mapHospitalLocationBlock(block: string): HospitalLocationItem | null {
  const latitude = parseNumeric(readXmlTag(block, 'wgs84Lat'));
  const longitude = parseNumeric(readXmlTag(block, 'wgs84Lon'));
  const hpid = readXmlTag(block, 'hpid') ?? '';

  if (!hpid || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    hospitalName: readXmlTag(block, 'dutyName') ?? readXmlTag(block, 'dutyname') ?? '',
    address: readXmlTag(block, 'dutyAddr') ?? '',
    erPhone: readXmlTag(block, 'dutyTel3') ?? readXmlTag(block, 'dutytel3') ?? '',
    phone: readXmlTag(block, 'dutyTel1') ?? '',
    latitude,
    longitude,
    emergencyClass: readXmlTag(block, 'dutyEmcls') ?? '',
    emergencyClassName: readXmlTag(block, 'dutyEmclsName') ?? '',
    description: readXmlTag(block, 'dutyInf') ?? '',
  };
}

function mapHospitalLocationRecord(record: Record<string, unknown>): HospitalLocationItem | null {
  const latitude = parseNumeric(readJsonString(record, 'wgs84Lat'));
  const longitude = parseNumeric(readJsonString(record, 'wgs84Lon'));
  const hpid = readJsonString(record, 'hpid');

  if (!hpid || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    hospitalName: readJsonString(record, 'dutyName', 'dutyname'),
    address: readJsonString(record, 'dutyAddr'),
    erPhone: readJsonString(record, 'dutyTel3', 'dutytel3'),
    phone: readJsonString(record, 'dutyTel1'),
    latitude,
    longitude,
    emergencyClass: readJsonString(record, 'dutyEmcls'),
    emergencyClassName: readJsonString(record, 'dutyEmclsName'),
    description: readJsonString(record, 'dutyInf'),
  };
}

function parseHospitalLocationResponse(
  rawText: string,
  contentType: string | null,
): HospitalLocationItem[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '응급의료기관 위치 API');
    return extractXmlItemBlocks(payload)
      .map(mapHospitalLocationBlock)
      .filter((item): item is HospitalLocationItem => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '응급의료기관 위치 API');
  return unwrapJsonItems(payload)
    .map(mapHospitalLocationRecord)
    .filter((item): item is HospitalLocationItem => item !== null);
}

function is24HourAed(block: Record<string, string | undefined>): boolean {
  const dayFlags = ['sunFrtYon', 'sunScdYon', 'sunThiYon', 'sunFurYon', 'sunFifYon'];
  return dayFlags.every((key) => parseYesNo(block[key]));
}

function mapAedBlock(block: string): AedLocationItem | null {
  const latitude = parseNumeric(readXmlTag(block, 'wgs84Lat'));
  const longitude = parseNumeric(readXmlTag(block, 'wgs84Lon'));
  const serialSeq = readXmlTag(block, 'serialSeq') ?? '';

  if (!serialSeq || (latitude === 0 && longitude === 0)) return null;

  const dayMap = {
    sunFrtYon: readXmlTag(block, 'sunFrtYon'),
    sunScdYon: readXmlTag(block, 'sunScdYon'),
    sunThiYon: readXmlTag(block, 'sunThiYon'),
    sunFurYon: readXmlTag(block, 'sunFurYon'),
    sunFifYon: readXmlTag(block, 'sunFifYon'),
  };

  return {
    serialSeq,
    org: readXmlTag(block, 'clinstNm') ?? readXmlTag(block, 'org') ?? '',
    buildAddress: readXmlTag(block, 'buildAddress') ?? '',
    buildPlace: readXmlTag(block, 'buildPlace') ?? '',
    latitude,
    longitude,
    distanceM: 0,
    walkMin: 0,
    model: readXmlTag(block, 'model') ?? '',
    manufacturer: readXmlTag(block, 'mfg') ?? '',
    managerTel: readXmlTag(block, 'managerTel') ?? '',
    clerkTel: readXmlTag(block, 'clinstNo') ?? readXmlTag(block, 'clerkTel') ?? '',
    available24h: is24HourAed(dayMap),
  };
}

function mapAedRecord(record: Record<string, unknown>): AedLocationItem | null {
  const latitude = parseNumeric(readJsonString(record, 'wgs84Lat'));
  const longitude = parseNumeric(readJsonString(record, 'wgs84Lon'));
  const serialSeq = readJsonString(record, 'serialSeq');

  if (!serialSeq || (latitude === 0 && longitude === 0)) return null;

  return {
    serialSeq,
    org: readJsonString(record, 'clinstNm', 'org'),
    buildAddress: readJsonString(record, 'buildAddress'),
    buildPlace: readJsonString(record, 'buildPlace'),
    latitude,
    longitude,
    distanceM: 0,
    walkMin: 0,
    model: readJsonString(record, 'model'),
    manufacturer: readJsonString(record, 'mfg'),
    managerTel: readJsonString(record, 'managerTel'),
    clerkTel: readJsonString(record, 'clinstNo', 'clerkTel'),
    available24h: is24HourAed({
      sunFrtYon: readJsonString(record, 'sunFrtYon'),
      sunScdYon: readJsonString(record, 'sunScdYon'),
      sunThiYon: readJsonString(record, 'sunThiYon'),
      sunFurYon: readJsonString(record, 'sunFurYon'),
      sunFifYon: readJsonString(record, 'sunFifYon'),
    }),
  };
}

function parseAedLocationResponse(rawText: string, contentType: string | null): AedLocationItem[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, 'AED API');
    return extractXmlItemBlocks(payload)
      .map(mapAedBlock)
      .filter((item): item is AedLocationItem => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, 'AED API');
  return unwrapJsonItems(payload)
    .map(mapAedRecord)
    .filter((item): item is AedLocationItem => item !== null);
}

function mapMedicineRecord(record: Record<string, unknown>): MedicineInfo {
  return {
    itemName: readJsonString(record, 'itemName'),
    entpName: readJsonString(record, 'entpName'),
    itemSeq: readJsonString(record, 'itemSeq'),
    itemImage: readJsonString(record, 'itemImage'),
    efficacy: readJsonString(record, 'efcyQesitm'),
    usage: readJsonString(record, 'useMethodQesitm'),
    warningBeforeUse: readJsonString(record, 'atpnWarnQesitm'),
    precautions: readJsonString(record, 'atpnQesitm'),
    interactions: readJsonString(record, 'intrcQesitm'),
    sideEffects: readJsonString(record, 'seQesitm'),
    storage: readJsonString(record, 'depositMethodQesitm'),
    updatedAt: readJsonString(record, 'updateDe', 'openDe'),
  };
}

function mapMedicineBlock(block: string): MedicineInfo {
  return {
    itemName: readXmlTag(block, 'itemName') ?? '',
    entpName: readXmlTag(block, 'entpName') ?? '',
    itemSeq: readXmlTag(block, 'itemSeq') ?? '',
    itemImage: readXmlTag(block, 'itemImage') ?? '',
    efficacy: readXmlTag(block, 'efcyQesitm') ?? '',
    usage: readXmlTag(block, 'useMethodQesitm') ?? '',
    warningBeforeUse: readXmlTag(block, 'atpnWarnQesitm') ?? '',
    precautions: readXmlTag(block, 'atpnQesitm') ?? '',
    interactions: readXmlTag(block, 'intrcQesitm') ?? '',
    sideEffects: readXmlTag(block, 'seQesitm') ?? '',
    storage: readXmlTag(block, 'depositMethodQesitm') ?? '',
    updatedAt: readXmlTag(block, 'updateDe') ?? readXmlTag(block, 'openDe') ?? '',
  };
}

function parseMedicineResponse(rawText: string, contentType: string | null): MedicineInfo[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, 'e약은요 API');
    return extractXmlItemBlocks(payload).map(mapMedicineBlock);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, 'e약은요 API');
  return unwrapJsonItems(payload).map(mapMedicineRecord);
}

async function fetchAllPages<T>(
  buildPageUrl: (pageNo: number, numOfRows: number) => string,
  parsePage: (rawText: string, contentType: string | null) => T[],
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = 10,
): Promise<T[]> {
  const first = await fetchPortalRaw(buildPageUrl(1, pageSize));
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
  const totalPages = Math.min(Math.ceil(totalCount / pageSize), maxPages);

  for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
    const page = await fetchPortalRaw(buildPageUrl(pageNo, pageSize));
    allItems.push(...parsePage(page.rawText, page.contentType));
  }

  return allItems;
}

export function calculateDistanceMeters(
  from: GeoCoordinate,
  to: GeoCoordinate,
): number {
  const earthRadiusM = 6_371_000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusM * c);
}

export function estimateWalkMinutes(distanceM: number): number {
  return Math.max(1, Math.round(distanceM / 80));
}

async function resolveSearchContext(options?: {
  coordinate?: GeoCoordinate;
  region?: LocationRegion;
}): Promise<{ coordinate: GeoCoordinate; region: LocationRegion }> {
  if (options?.coordinate && options?.region) {
    return { coordinate: options.coordinate, region: options.region };
  }

  if (options?.coordinate) {
    const region = await resolveRegionFromCoordinate(options.coordinate);
    return { coordinate: options.coordinate, region };
  }

  const location = getLocationWithRegionImmediate();
  void refreshLocationCache();

  if (options?.region) {
    return { coordinate: location.coordinate, region: options.region };
  }

  return {
    coordinate: location.coordinate,
    region: location.region,
  };
}

const MOONLIGHT_HOSPITAL_KEYWORDS = ['달빛', '달빛어린이', '어린이병원', '소아응급'] as const;

export function isMoonlightChildrenHospital(name: string | null | undefined): boolean {
  const normalized = (name ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return MOONLIGHT_HOSPITAL_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function isPediatricPriorityHospital(
  hospital: Pick<
    NearbyHospital,
    'hospitalName' | 'availablePediatricErBeds' | 'isMoonlightHospital'
  >,
): boolean {
  const pediatricBeds = parseNumeric(hospital.availablePediatricErBeds);
  return (
    pediatricBeds > 0 ||
    hospital.isMoonlightHospital ||
    isMoonlightChildrenHospital(hospital.hospitalName)
  );
}

/** 소아/달빛어린이 병원 최상단 → 나머지 거리순 */
export function sortHospitalsWithPediatricPriority(hospitals: NearbyHospital[]): NearbyHospital[] {
  const pediatric: NearbyHospital[] = [];
  const regular: NearbyHospital[] = [];

  for (const hospital of hospitals) {
    if (isPediatricPriorityHospital(hospital)) {
      pediatric.push(hospital);
    } else {
      regular.push(hospital);
    }
  }

  const byDistance = (a: NearbyHospital, b: NearbyHospital) => a.distanceM - b.distanceM;
  pediatric.sort(byDistance);
  regular.sort(byDistance);

  return [...pediatric, ...regular];
}

export function safeDisplayText(value: string | null | undefined, fallback = '-'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function filterEmergencyHospitals<T extends { hospitalName: string }>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.hospitalName ?? '').toLowerCase().includes(q));
}

export function formatEmergencyUpdatedAt(raw: string | null | undefined): string {
  const value = raw?.trim() ?? '';
  if (!value) return '-';
  if (/^\d{14}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)} ${value.slice(8, 10)}:${value.slice(10, 12)}`;
  }
  return value;
}

export function getEquipmentLabels(item: EmergencyBedItem): string[] {
  return buildEmergencyHospitalSpecs(item).equipment
    .filter((spec) => spec.available)
    .map((spec) => spec.label);
}

export type { EmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';
export {
  buildEmergencyHospitalSpecs,
  resolveErDutyPhone,
  resolvePediatricDutyPhone,
} from '@/utils/emergencyHospitalSpecs';

export type ErDashboardStats = {
  totalHospitals: number;
  totalAvailableBeds: number;
  availableCount: number;
  congestedCount: number;
  fullCount: number;
  pediatricCount: number;
};

export function summarizeEmergencyBedItems(items: EmergencyBedItem[]): ErDashboardStats {
  const sanitized = items.map(sanitizeEmergencyBedItem);
  return {
    totalHospitals: sanitized.length,
    totalAvailableBeds: sanitized.reduce((sum, item) => sum + item.availableErBeds, 0),
    availableCount: sanitized.filter((item) => item.status === 'available').length,
    congestedCount: sanitized.filter((item) => item.status === 'congested').length,
    fullCount: sanitized.filter((item) => item.status === 'full').length,
    pediatricCount: sanitized.filter((item) => item.availablePediatricErBeds > 0).length,
  };
}

export async function fetchEmergencyBedInfo(
  query: EmergencyBedQuery,
): Promise<EmergencyBedResponse> {
  const normalizedRegion = normalizeEmergencyApiRegion({
    stage1: query.stage1,
    stage2: query.stage2,
    label: `${query.stage1} ${query.stage2}`.trim(),
  });
  const url = buildEmergencyBedUrl({
    ...query,
    stage1: normalizedRegion.stage1,
    stage2: normalizedRegion.stage2,
  });

  if (__DEV__) {
    console.log('[ER API] fetchEmergencyBedInfo request', {
      stage1: normalizedRegion.stage1,
      stage2: normalizedRegion.stage2,
      pageNo: query.pageNo ?? 1,
      numOfRows: query.numOfRows ?? DEFAULT_PAGE_SIZE,
    });
  }

  const { rawText, contentType } = await fetchPortalRaw(url);
  const response = parseEmergencyBedResponse(rawText, contentType);

  if (__DEV__) {
    console.log('[ER API] fetchEmergencyBedInfo response', {
      resultCode: response.resultCode,
      resultMsg: response.resultMsg,
      totalCount: response.totalCount,
      itemCount: response.items.length,
      sample: response.items.slice(0, 3).map((item) => ({
        hpid: item.hpid,
        name: item.hospitalName,
        hvec: item.availableErBeds,
        status: item.status,
      })),
    });
  }

  return response;
}

/** 지역별 응급실 병상 API — 전체 페이지 조회 */
export async function fetchAllEmergencyBedInfo(region: LocationRegion): Promise<EmergencyBedItem[]> {
  const normalized = normalizeEmergencyApiRegion(region);

  if (__DEV__) {
    console.log('[ER API] fetchAllEmergencyBedInfo start', normalized);
  }

  const items = await fetchAllPages(
    (pageNo, numOfRows) =>
      buildEmergencyBedUrl({
        stage1: normalized.stage1,
        stage2: normalized.stage2,
        pageNo,
        numOfRows,
      }),
    (rawText, contentType) => parseEmergencyBedResponse(rawText, contentType).items,
    DEFAULT_PAGE_SIZE,
    10,
  );

  if (__DEV__) {
    console.log('[ER API] fetchAllEmergencyBedInfo done', {
      region: normalized.label,
      count: items.length,
      totalBeds: items.reduce((sum, item) => sum + item.availableErBeds, 0),
    });
  }

  return items;
}

async function fetchHospitalLocations(region: LocationRegion): Promise<HospitalLocationItem[]> {
  return fetchAllPages(
    (pageNo, numOfRows) =>
      buildPortalUrl(HOSPITAL_LOCATION_ENDPOINT, {
        Q0: region.stage1,
        Q1: region.stage2,
        pageNo,
        numOfRows,
      }),
    parseHospitalLocationResponse,
  );
}

async function fetchAedLocations(region: LocationRegion): Promise<AedLocationItem[]> {
  return fetchAllPages(
    (pageNo, numOfRows) =>
      buildPortalUrl(AED_LOCATION_ENDPOINT, {
        Q0: region.stage1,
        Q1: region.stage2 || undefined,
        pageNo,
        numOfRows,
      }),
    parseAedLocationResponse,
    DEFAULT_PAGE_SIZE,
    20,
  );
}

function mergeHospitalData(
  locations: HospitalLocationItem[],
  beds: EmergencyBedItem[],
  coordinate: GeoCoordinate,
  radiusMeters: number,
): NearbyHospital[] {
  const bedMap = new Map(
    beds.map((bed) => [bed.hpid, sanitizeEmergencyBedItem(bed)]),
  );

  return locations
    .map((location) => {
      const bed = bedMap.get(location.hpid);
      const lat = parseNumeric(location.latitude);
      const lon = parseNumeric(location.longitude);
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: lat,
        longitude: lon,
      });

      if (distanceM > radiusMeters) return null;

      const mergedBed: EmergencyBedItem = bed ?? sanitizeEmergencyBedItem({
        rnum: 0,
        hpid: location.hpid,
        phpid: location.hpid,
        hospitalName: location.hospitalName,
        erPhone: location.erPhone,
        updatedAt: '',
        availableErBeds: 0,
        availablePediatricErBeds: 0,
        availableSurgeryBeds: 0,
        availableNeuroIcuBeds: 0,
        availableNeonatalIcuBeds: 0,
        availableChestIcuBeds: 0,
        availableGeneralIcuBeds: 0,
        availableInpatientBeds: 0,
        onCallDoctor: '',
        ctAvailable: false,
        mriAvailable: false,
        angioAvailable: false,
        ventilatorAvailable: false,
        ambulanceAvailable: false,
        erDoctorPhone: '',
        pediatricDoctorPhone: '',
        status: 'full',
        icuInternalMedicineBeds: 0,
        icuSurgeryBeds: 0,
        icuOrthopedicBeds: 0,
        icuNeurologyBeds: 0,
        icuNeurosurgeryBeds: 0,
        icuToxicologyBeds: 0,
        icuBurnBeds: 0,
        icuTraumaBeds: 0,
        pediatricVentilatorAvailable: false,
        incubatorAvailable: false,
      });

      const hospitalName = safeDisplayText(mergedBed.hospitalName || location.hospitalName, '병원명 미상');
      const isMoonlight = isMoonlightChildrenHospital(hospitalName);

      return {
        ...mergedBed,
        ...location,
        latitude: lat,
        longitude: lon,
        hospitalName,
        erPhone: safeDisplayText(mergedBed.erPhone || location.erPhone, '-'),
        emergencyClassName: safeDisplayText(location.emergencyClassName, '응급의학과'),
        address: safeDisplayText(location.address, '-'),
        distanceM,
        distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
        walkMin: estimateWalkMinutes(distanceM),
        isMoonlightHospital: isMoonlight,
        isPediatricPriority: isMoonlight || parseNumeric(mergedBed.availablePediatricErBeds) > 0,
      } satisfies NearbyHospital;
    })
    .filter((item): item is NearbyHospital => item !== null)
    .sort((a, b) => a.distanceM - b.distanceM);
}

export async function fetchNearbyHospitals(
  options: NearbyHospitalOptions = {},
): Promise<NearbyHospital[]> {
  const { coordinate, region } = await resolveSearchContext(options);
  const radiusMeters = options.radiusMeters ?? DEFAULT_RADIUS_METERS;
  const maxResults = options.maxResults ?? 50;

  const [locations, bedResponse] = await Promise.all([
    fetchHospitalLocations(region),
    fetchEmergencyBedInfo({
      stage1: region.stage1,
      stage2: region.stage2,
      pageNo: 1,
      numOfRows: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return sortHospitalsWithPediatricPriority(
    mergeHospitalData(
      locations,
      bedResponse.items,
      coordinate,
      radiusMeters,
    ),
  ).slice(0, maxResults);
}

async function fetchAedByAddressSearch(
  addressQuery: string,
  maxResults: number,
  presetRegion?: LocationRegion,
): Promise<AedLocationItem[]> {
  const candidates = presetRegion
    ? [presetRegion]
    : await resolveRegionCandidatesFromAddressQuery(addressQuery);

  if (candidates.length === 0) {
    throw new EmergencyApiError(
      `'${addressQuery}' 지역을 찾을 수 없습니다. 시·군·구 또는 읍·면·동 이름으로 검색해 주세요.`,
    );
  }

  const seen = new Set<string>();
  const merged: AedLocationItem[] = [];

  for (const region of candidates.slice(0, 4)) {
    const batch = await fetchAedLocations(region);
    for (const item of batch) {
      const key = item.serialSeq || `${item.buildAddress}|${item.latitude}|${item.longitude}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  const filtered = merged.filter((item) => matchesAddressQuery(item, addressQuery));

  return (filtered.length > 0 ? filtered : merged)
    .map((item) => ({ ...item, distanceM: 0, walkMin: 0 }))
    .slice(0, maxResults);
}

export async function fetchAedList(options: AedListOptions = {}): Promise<AedLocationItem[]> {
  const maxResults = options.maxResults ?? 30;
  const addressQuery = options.addressQuery?.trim();

  // ── 텍스트 검색 모드: GPS 반경 필터 완전 무시, Q0/Q1 기반 전국 조회 ──
  if (addressQuery) {
    return fetchAedByAddressSearch(addressQuery, maxResults, options.region);
  }

  // ── GPS 모드: 검색어 없을 때만 현재 위치 기반 ──
  const { coordinate, region } = await resolveSearchContext(options);
  const radiusMeters = options.radiusMeters ?? DEFAULT_AED_RADIUS_METERS;

  const items = await fetchAedLocations(region);

  return items
    .map((item) => {
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: parseNumeric(item.latitude),
        longitude: parseNumeric(item.longitude),
      });

      return {
        ...item,
        distanceM,
        walkMin: estimateWalkMinutes(distanceM),
      };
    })
    .filter((item) => item.distanceM <= radiusMeters)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, maxResults);
}

export const DEFAULT_MEDICINE_PAGE_SIZE = 25;

const POPULAR_MEDICINE_SEEDS = [
  '타이레놀',
  '게보린',
  '아스피린',
  '부루펜',
  '판콜',
  '센트룸',
  '베아제',
  '마데카솔',
  '알레그라',
  '후시딘',
  '맥시부펜',
  '우루사',
];

function dedupeMedicines(items: MedicineInfo[]): MedicineInfo[] {
  const seen = new Set<string>();
  const merged: MedicineInfo[] = [];

  for (const item of items) {
    const key = item.itemSeq || item.itemName;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

export async function fetchMedicineBrowse(
  options: MedicineBrowseOptions = {},
): Promise<MedicineInfo[]> {
  const params: Record<string, string | number | undefined> = {
    type: 'json',
    pageNo: options.pageNo ?? 1,
    numOfRows: options.numOfRows ?? DEFAULT_MEDICINE_PAGE_SIZE,
  };

  if (options.itemName?.trim()) {
    params.itemName = options.itemName.trim();
  }

  const url = buildPortalUrl(DRUG_SEARCH_ENDPOINT, params);

  try {
    const { rawText, contentType } = await fetchPortalRaw(url);
    return parseMedicineResponse(rawText, contentType);
  } catch (error) {
    if (error instanceof EmergencyApiError && error.statusCode === 403) {
      throw new EmergencyApiError(
        'e약은요 API 사용 권한이 없습니다. 공공데이터포털에서 "의약품개요정보(e약은요)" API 활용 신청 후 다시 시도해 주세요.',
        error.resultCode,
        error.statusCode,
      );
    }
    throw error;
  }
}

export async function fetchInitialMedicines(limit = 30): Promise<MedicineInfo[]> {
  try {
    const browse = await fetchMedicineBrowse({ pageNo: 1, numOfRows: limit });
    if (browse.length > 0) return browse.slice(0, limit);
  } catch {
    // browse without itemName may fail — fall through to seed search
  }

  const seeds = POPULAR_MEDICINE_SEEDS.slice(0, 8);
  const batches = await Promise.all(
    seeds.map((name) =>
      searchMedicine({ itemName: name, numOfRows: 4 }).catch(() => [] as MedicineInfo[]),
    ),
  );

  return dedupeMedicines(batches.flat()).slice(0, limit);
}

export async function searchMedicine(
  options: MedicineSearchOptions,
): Promise<MedicineInfo[]> {
  const itemName = options.itemName.trim();
  if (!itemName) {
    throw new EmergencyApiError('검색할 약 이름을 입력해 주세요.');
  }

  const url = buildPortalUrl(DRUG_SEARCH_ENDPOINT, {
    type: 'json',
    pageNo: options.pageNo ?? 1,
    numOfRows: options.numOfRows ?? 10,
    itemName,
  });

  try {
    const { rawText, contentType } = await fetchPortalRaw(url);
    return parseMedicineResponse(rawText, contentType);
  } catch (error) {
    if (error instanceof EmergencyApiError && error.statusCode === 403) {
      throw new EmergencyApiError(
        'e약은요 API 사용 권한이 없습니다. 공공데이터포털에서 "의약품개요정보(e약은요)" API 활용 신청 후 다시 시도해 주세요.',
        error.resultCode,
        error.statusCode,
      );
    }
    throw error;
  }
}

export function getFallbackRegion(): LocationRegion {
  return getDefaultRegion();
}

// ─── 약국 (휴일지킴이) ─────────────────────────────────────────────

const PHARMACY_DAY_LABELS: Record<number, string> = {
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
  7: '일요일',
  8: '공휴일',
};

function getTreatmentDayCode(date = new Date()): number {
  const day = date.getDay();
  if (day === 0) return 7;
  if (day === 6) return 6;
  return day;
}

function formatDutyTime(raw: string | undefined): string {
  if (!raw?.trim() || raw.includes('휴무')) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return raw.trim();
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function getPharmacyDutyHours(
  block: Record<string, string | undefined>,
  dayCode: number,
): { start: string; end: string } {
  const start = formatDutyTime(block[`dutyTime${dayCode}s`]);
  const end = formatDutyTime(block[`dutyTime${dayCode}c`]);
  return { start, end };
}

function isPharmacyOpenNow(start: string, end: string, now = new Date()): boolean {
  if (!start || !end) return false;
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const current = now.getHours() * 60 + now.getMinutes();
  const open = toMinutes(start);
  const close = toMinutes(end);
  if (close <= open) return current >= open || current <= close;
  return current >= open && current <= close;
}

function mapPharmacyBlock(block: string, dayCode: number): PharmacyInfo | null {
  const fields: Record<string, string | undefined> = {};
  for (let d = 1; d <= 8; d += 1) {
    fields[`dutyTime${d}s`] = readXmlTag(block, `dutyTime${d}s`);
    fields[`dutyTime${d}c`] = readXmlTag(block, `dutyTime${d}c`);
  }

  const latitude = parseNumeric(readXmlTag(block, 'wgs84Lat'));
  const longitude = parseNumeric(readXmlTag(block, 'wgs84Lon'));
  const hpid = readXmlTag(block, 'hpid') ?? '';
  const { start, end } = getPharmacyDutyHours(fields, dayCode);

  if (!hpid || !start || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    name: readXmlTag(block, 'dutyName') ?? readXmlTag(block, 'dutyname') ?? '',
    address: readXmlTag(block, 'dutyAddr') ?? '',
    phone: readXmlTag(block, 'dutyTel1') ?? '',
    latitude,
    longitude,
    distanceM: 0,
    distanceKm: 0,
    walkMin: 0,
    dutyTimeStart: start,
    dutyTimeEnd: end,
    isOpenNow: isPharmacyOpenNow(start, end),
    treatmentDayLabel: PHARMACY_DAY_LABELS[dayCode] ?? '오늘',
  };
}

function mapPharmacyRecord(record: Record<string, unknown>, dayCode: number): PharmacyInfo | null {
  const fields: Record<string, string | undefined> = {};
  for (let d = 1; d <= 8; d += 1) {
    fields[`dutyTime${d}s`] = readJsonString(record, `dutyTime${d}s`);
    fields[`dutyTime${d}c`] = readJsonString(record, `dutyTime${d}c`);
  }

  const latitude = parseNumeric(readJsonString(record, 'wgs84Lat'));
  const longitude = parseNumeric(readJsonString(record, 'wgs84Lon'));
  const hpid = readJsonString(record, 'hpid');
  const { start, end } = getPharmacyDutyHours(fields, dayCode);

  if (!hpid || !start || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    name: readJsonString(record, 'dutyName', 'dutyname'),
    address: readJsonString(record, 'dutyAddr'),
    phone: readJsonString(record, 'dutyTel1'),
    latitude,
    longitude,
    distanceM: 0,
    distanceKm: 0,
    walkMin: 0,
    dutyTimeStart: start,
    dutyTimeEnd: end,
    isOpenNow: isPharmacyOpenNow(start, end),
    treatmentDayLabel: PHARMACY_DAY_LABELS[dayCode] ?? '오늘',
  };
}

function parsePharmacyListResponse(
  rawText: string,
  contentType: string | null,
  dayCode: number,
): PharmacyInfo[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '약국 API');
    return extractXmlItemBlocks(payload)
      .map((block) => mapPharmacyBlock(block, dayCode))
      .filter((item): item is PharmacyInfo => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '약국 API');
  return unwrapJsonItems(payload)
    .map((record) => mapPharmacyRecord(record, dayCode))
    .filter((item): item is PharmacyInfo => item !== null);
}

async function fetchPharmaciesByRegion(
  region: LocationRegion,
  dayCode: number,
): Promise<PharmacyInfo[]> {
  return fetchAllPages(
    (pageNo, numOfRows) =>
      buildPortalUrl(PHARMACY_LIST_ENDPOINT, {
        Q0: region.stage1,
        Q1: region.stage2,
        QT: dayCode,
        pageNo,
        numOfRows,
      }),
    (raw, type) => parsePharmacyListResponse(raw, type, dayCode),
    DEFAULT_PAGE_SIZE,
    5,
  );
}

async function fetchPharmaciesByCoordinate(
  coordinate: GeoCoordinate,
  dayCode: number,
): Promise<PharmacyInfo[]> {
  const url = buildPortalUrl(PHARMACY_LOCATION_ENDPOINT, {
    WGS84LAT: coordinate.latitude,
    WGS84LON: coordinate.longitude,
    pageNo: 1,
    numOfRows: DEFAULT_PAGE_SIZE,
  });

  try {
    const { rawText, contentType } = await fetchPortalRaw(url);
    return parsePharmacyListResponse(rawText, contentType, dayCode);
  } catch {
    return [];
  }
}

/** GPS 기반 인근 운영 약국 (휴일지킴이 포함) — 거리순 반환 */
export async function fetchNearbyPharmacies(
  options: NearbyPharmacyOptions = {},
): Promise<PharmacyInfo[]> {
  const { coordinate, region } = await resolveSearchContext(options);
  const radiusMeters = options.radiusMeters ?? DEFAULT_RADIUS_METERS;
  const maxResults = options.maxResults ?? 30;
  const dayCode = options.holidayKeeper ? 8 : getTreatmentDayCode();

  let items = await fetchPharmaciesByCoordinate(coordinate, dayCode);
  if (items.length === 0) {
    items = await fetchPharmaciesByRegion(region, dayCode);
  }

  if (options.holidayKeeper && items.length === 0 && dayCode !== 8) {
    items = await fetchPharmaciesByRegion(region, 8);
  }

  return items
    .map((item) => {
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return {
        ...item,
        distanceM,
        distanceKm: Number((distanceM / 1000).toFixed(1)),
        walkMin: estimateWalkMinutes(distanceM),
      };
    })
    .filter((item) => item.distanceM <= radiusMeters)
    .sort((a, b) => {
      if (a.isOpenNow !== b.isOpenNow) return a.isOpenNow ? -1 : 1;
      return a.distanceM - b.distanceM;
    })
    .slice(0, maxResults);
}

// ─── 독성물질 (화학물질안전원) ─────────────────────────────────────

function isCasNumber(value: string): boolean {
  return /^\d{2,7}-\d{2}-\d$/.test(value.trim());
}

function mapToxicBlock(block: string): ToxicSubstanceInfo {
  const inhalation = readXmlTag(block, 'inhale') ?? '';
  const oral = readXmlTag(block, 'oral') ?? '';
  const skin = readXmlTag(block, 'skin') ?? '';
  const eye = readXmlTag(block, 'eyeball') ?? '';

  return {
    dataNo: readXmlTag(block, 'dataNo') ?? '',
    nameKo: readXmlTag(block, 'chemKo') ?? '',
    nameEn: readXmlTag(block, 'chemEn') ?? '',
    casNo: readXmlTag(block, 'casNo') ?? '',
    generalSymptoms: readXmlTag(block, 'symptom') ?? '',
    inhalation,
    skin,
    eye,
    oral,
    other: readXmlTag(block, 'etc') ?? '',
    emergencyTreatment: [inhalation, skin, eye, oral].filter(Boolean).join('\n\n'),
    source: 'api',
  };
}

function mapToxicRecord(record: Record<string, unknown>): ToxicSubstanceInfo {
  const inhalation = readJsonString(record, 'inhale');
  const oral = readJsonString(record, 'oral');
  const skin = readJsonString(record, 'skin');
  const eye = readJsonString(record, 'eyeball');

  return {
    dataNo: readJsonString(record, 'dataNo'),
    nameKo: readJsonString(record, 'chemKo'),
    nameEn: readJsonString(record, 'chemEn'),
    casNo: readJsonString(record, 'casNo'),
    generalSymptoms: readJsonString(record, 'symptom'),
    inhalation,
    skin,
    eye,
    oral,
    other: readJsonString(record, 'etc'),
    emergencyTreatment: [inhalation, skin, eye, oral].filter(Boolean).join('\n\n'),
    source: 'api',
  };
}

function parseToxicSubstanceResponse(
  rawText: string,
  contentType: string | null,
): ToxicSubstanceInfo[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '화학물질안전관리정보 API');
    return extractXmlItemBlocks(payload).map(mapToxicBlock);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '화학물질안전관리정보 API');
  return unwrapJsonItems(payload).map(mapToxicRecord);
}

function filterToxicByName(items: ToxicSubstanceInfo[], query: string): ToxicSubstanceInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.nameKo.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.casNo.toLowerCase().includes(q),
  );
}

async function fetchToxicFromApi(
  params: Record<string, string | number | undefined>,
): Promise<ToxicSubstanceInfo[]> {
  const url = buildPortalUrl(TOXIC_SEARCH_ENDPOINT, {
    pageNo: 1,
    numOfRows: 50,
    ...params,
  });
  const { rawText, contentType } = await fetchPortalRaw(url);
  return parseToxicSubstanceResponse(rawText, contentType);
}

function toxicFromMock(query: string): ToxicSubstanceInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return searchHazardousMaterials(q).map((item) => ({
    dataNo: item.id,
    nameKo: item.name,
    nameEn: item.nameEn,
    casNo: '',
    generalSymptoms: item.symptoms.join(', '),
    inhalation:
      item.symptoms.find((s) => s.includes('호흡') || s.includes('기침')) ?? item.symptoms[0] ?? '',
    skin: item.symptoms.find((s) => s.includes('피부') || s.includes('화상')) ?? '',
    eye: item.symptoms.find((s) => s.includes('눈')) ?? '',
    oral: item.symptoms.find((s) => s.includes('구토') || s.includes('복')) ?? '',
    other: `${item.hazardClass} · ${item.unNumber}`,
    emergencyTreatment: item.firstActions.join('\n'),
    source: 'mock' as const,
  }));
}

/** 화학물질명/CAS 검색 → 독성 증상·응급처치 실시간 조회 */
export async function searchToxicSubstance(
  options: ToxicSubstanceSearchOptions,
): Promise<ToxicSubstanceInfo[]> {
  const query = options.query.trim();
  if (!query) {
    throw new EmergencyApiError('검색할 화학물질명을 입력해 주세요.');
  }

  const attempts: Record<string, string | number | undefined>[] = [];

  if (isCasNumber(query)) {
    attempts.push({ casNo: query });
  }
  attempts.push({ chemKo: query }, { chemEn: query }, { casNo: query });

  for (const params of attempts) {
    try {
      const results = await fetchToxicFromApi({
        ...params,
        pageNo: options.pageNo ?? 1,
        numOfRows: options.numOfRows ?? 20,
      });
      const filtered = filterToxicByName(results, query);
      if (filtered.length > 0) return filtered;
      if (results.length > 0 && isCasNumber(query)) return results;
    } catch (error) {
      if (error instanceof EmergencyApiError && error.statusCode === 403) {
        break;
      }
    }
  }

  const mockResults = toxicFromMock(query);
  if (mockResults.length > 0) return mockResults;

  throw new EmergencyApiError(
    '독성물질 정보를 찾지 못했습니다. CAS 번호로 검색하거나 공공데이터포털에서 "화학물질안전관리정보" API 활용 신청을 확인해 주세요.',
  );
}

// ─── 지도 마커 지연 로딩 (1단계: 껍데기 / 2단계: 클릭 시 상세) ─────────────

export { filterByMapBounds, regionToBounds, type MapBounds } from '@/utils/mapViewport';

const SHELL_PAGE_SIZE = 100;
const DETAIL_SEARCH_MAX_PAGES = 8;

/** 1단계 — 지도 마커용 최소 정보 (좌표·이름·ID만) */
export type AedMarkerShell = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  walkMin: number;
};

export type HospitalMarkerShell = {
  hpid: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  walkMin: number;
  distanceKm: number;
  availableErBeds: number;
  availablePediatricErBeds: number;
  status: ErStatus;
  isPediatricPriority: boolean;
};

export type PharmacyMarkerShell = {
  hpid: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  walkMin: number;
  distanceKm: number;
};

export type HospitalDetail = NearbyHospital & {
  description: string;
  specialties: string[];
  weeklySchedule: HospitalDutyDay[];
  isOpenNow: boolean;
  openStatusLabel: string;
};

export type EmergencyHospitalBasisInfo = {
  hpid: string;
  hospitalName: string;
  address: string;
  phone: string;
  erPhone: string;
  emergencyClassName: string;
  description: string;
  specialties: string[];
  weeklySchedule: HospitalDutyDay[];
  isOpenNow: boolean;
  openStatusLabel: string;
  latitude: number;
  longitude: number;
};

function parseSpecialtyTags(...values: Array<string | null | undefined>): string[] {
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

function collectDutyFieldsFromXmlBlock(block: string): Record<string, string | undefined> {
  const fields: Record<string, string | undefined> = {};
  for (let dayCode = 1; dayCode <= 8; dayCode += 1) {
    fields[`dutyTime${dayCode}s`] = readXmlTag(block, `dutyTime${dayCode}s`);
    fields[`dutyTime${dayCode}c`] = readXmlTag(block, `dutyTime${dayCode}c`);
  }
  fields.dutyStart = readXmlTag(block, 'dutyStart');
  return fields;
}

function collectDutyFieldsFromJsonRecord(record: Record<string, unknown>): Record<string, string | undefined> {
  const fields: Record<string, string | undefined> = {};
  for (let dayCode = 1; dayCode <= 8; dayCode += 1) {
    fields[`dutyTime${dayCode}s`] = readJsonString(record, `dutyTime${dayCode}s`);
    fields[`dutyTime${dayCode}c`] = readJsonString(record, `dutyTime${dayCode}c`);
  }
  fields.dutyStart = readJsonString(record, 'dutyStart');
  return fields;
}

function mapHospitalBasisBlock(block: string): EmergencyHospitalBasisInfo | null {
  const hpid = readXmlTag(block, 'hpid') ?? '';
  const hospitalName = readXmlTag(block, 'dutyName') ?? readXmlTag(block, 'dutyname') ?? '';
  if (!hpid && !hospitalName) return null;

  const dutyFields = collectDutyFieldsFromXmlBlock(block);
  const weeklySchedule = parseWeeklyDutySchedule(dutyFields);
  const openStatus = resolveHospitalOpenStatus(weeklySchedule);

  return {
    hpid,
    hospitalName: safeDisplayText(hospitalName, '병원'),
    address: safeDisplayText(readXmlTag(block, 'dutyAddr'), ''),
    phone: safeDisplayText(readXmlTag(block, 'dutyTel1'), ''),
    erPhone: safeDisplayText(readXmlTag(block, 'dutyTel3') ?? readXmlTag(block, 'dutytel3'), ''),
    emergencyClassName: safeDisplayText(readXmlTag(block, 'dutyEmclsName'), ''),
    description: safeDisplayText(readXmlTag(block, 'dutyInf'), ''),
    specialties: parseSpecialtyTags(readXmlTag(block, 'dgsbjtCdNm'), readXmlTag(block, 'dutyDivNam')),
    weeklySchedule,
    isOpenNow: openStatus.isOpenNow,
    openStatusLabel: openStatus.label,
    latitude: parseNumeric(readXmlTag(block, 'wgs84Lat')),
    longitude: parseNumeric(readXmlTag(block, 'wgs84Lon')),
  };
}

function mapHospitalBasisRecord(record: Record<string, unknown>): EmergencyHospitalBasisInfo | null {
  const hpid = readJsonString(record, 'hpid');
  const hospitalName = readJsonString(record, 'dutyName', 'dutyname');
  if (!hpid && !hospitalName) return null;

  const dutyFields = collectDutyFieldsFromJsonRecord(record);
  const weeklySchedule = parseWeeklyDutySchedule(dutyFields);
  const openStatus = resolveHospitalOpenStatus(weeklySchedule);

  return {
    hpid,
    hospitalName: safeDisplayText(hospitalName, '병원'),
    address: safeDisplayText(readJsonString(record, 'dutyAddr'), ''),
    phone: safeDisplayText(readJsonString(record, 'dutyTel1'), ''),
    erPhone: safeDisplayText(readJsonString(record, 'dutyTel3', 'dutytel3'), ''),
    emergencyClassName: safeDisplayText(readJsonString(record, 'dutyEmclsName'), ''),
    description: safeDisplayText(readJsonString(record, 'dutyInf'), ''),
    specialties: parseSpecialtyTags(
      readJsonString(record, 'dgsbjtCdNm'),
      readJsonString(record, 'dutyDivNam'),
    ),
    weeklySchedule,
    isOpenNow: openStatus.isOpenNow,
    openStatusLabel: openStatus.label,
    latitude: parseNumeric(readJsonString(record, 'wgs84Lat')),
    longitude: parseNumeric(readJsonString(record, 'wgs84Lon')),
  };
}

function parseHospitalBasisResponse(
  rawText: string,
  contentType: string | null,
): EmergencyHospitalBasisInfo[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '응급의료기관 기본정보 API');
    return extractXmlItemBlocks(payload)
      .map(mapHospitalBasisBlock)
      .filter((item): item is EmergencyHospitalBasisInfo => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '응급의료기관 기본정보 API');
  return unwrapJsonItems(payload)
    .map(mapHospitalBasisRecord)
    .filter((item): item is EmergencyHospitalBasisInfo => item !== null);
}

/** 응급의료기관 기본정보 (진료시간·과목·기관설명) */
export async function fetchEmergencyHospitalBasis(
  hpid: string,
  region: LocationRegion,
): Promise<EmergencyHospitalBasisInfo | null> {
  const normalizedRegion = normalizeEmergencyApiRegion(region);

  try {
    const url = buildPortalUrl(HOSPITAL_BASIS_ENDPOINT, {
      HPID: hpid,
      Q0: normalizedRegion.stage1,
      Q1: normalizedRegion.stage2 || undefined,
      pageNo: 1,
      numOfRows: 10,
    });
    const { rawText, contentType } = await fetchPortalRaw(url);
    const items = parseHospitalBasisResponse(rawText, contentType);
    return items.find((item) => item.hpid === hpid) ?? items[0] ?? null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[ER API] fetchEmergencyHospitalBasis failed', { hpid, error });
    }
    return null;
  }
}

const markerDetailCache = new Map<string, unknown>();

function enrichShellsWithDistance<T extends { latitude: number; longitude: number }>(
  shells: T[],
  coordinate: GeoCoordinate,
): (T & { distanceM: number; walkMin: number; distanceKm: number })[] {
  return shells
    .map((shell) => {
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: shell.latitude,
        longitude: shell.longitude,
      });
      return {
        ...shell,
        distanceM,
        walkMin: estimateWalkMinutes(distanceM),
        distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
      };
    })
    .sort((a, b) => a.distanceM - b.distanceM);
}

// ── AED 껍데기 파서 (clinstNm, wgs84Lat, wgs84Lon, rnum/serialSeq만) ──

function mapAedShellBlock(block: string): AedMarkerShell | null {
  const id = readXmlTag(block, 'rnum') ?? readXmlTag(block, 'serialSeq') ?? '';
  const name =
    readXmlTag(block, 'clinstNm') ??
    readXmlTag(block, 'org') ??
    readXmlTag(block, 'buildPlace') ??
    'AED';
  const latitude = parseNumeric(readXmlTag(block, 'wgs84Lat'));
  const longitude = parseNumeric(readXmlTag(block, 'wgs84Lon'));

  if (!id || (latitude === 0 && longitude === 0)) return null;

  return { id, name, latitude, longitude, distanceM: 0, walkMin: 0 };
}

function mapAedShellRecord(record: Record<string, unknown>): AedMarkerShell | null {
  const id = readJsonString(record, 'rnum', 'serialSeq');
  const name =
    readJsonString(record, 'clinstNm', 'org', 'buildPlace') || 'AED';
  const latitude = parseNumeric(readJsonString(record, 'wgs84Lat'));
  const longitude = parseNumeric(readJsonString(record, 'wgs84Lon'));

  if (!id || (latitude === 0 && longitude === 0)) return null;

  return { id, name, latitude, longitude, distanceM: 0, walkMin: 0 };
}

function parseAedShellResponse(rawText: string, contentType: string | null): AedMarkerShell[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, 'AED 껍데기 API');
    return extractXmlItemBlocks(payload)
      .map(mapAedShellBlock)
      .filter((item): item is AedMarkerShell => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, 'AED 껍데기 API');
  return unwrapJsonItems(payload)
    .map(mapAedShellRecord)
    .filter((item): item is AedMarkerShell => item !== null);
}

async function fetchAedShellPage(region: LocationRegion, pageNo: number): Promise<AedMarkerShell[]> {
  const url = buildPortalUrl(AED_LOCATION_ENDPOINT, {
    Q0: region.stage1,
    Q1: region.stage2 || undefined,
    pageNo,
    numOfRows: SHELL_PAGE_SIZE,
  });
  const { rawText, contentType } = await fetchPortalRaw(url);
  return parseAedShellResponse(rawText, contentType);
}

/** 1단계 — AED 마커 껍데기 (첫 페이지만, 최소 XML 파싱) */
export async function fetchAedMarkerShells(
  options: AedListOptions = {},
): Promise<AedMarkerShell[]> {
  const maxResults = options.maxResults ?? 50;
  const addressQuery = options.addressQuery?.trim();

  if (addressQuery) {
    const candidates = options.region
      ? [options.region]
      : await resolveRegionCandidatesFromAddressQuery(addressQuery);

    if (candidates.length === 0) {
      throw new EmergencyApiError(`'${addressQuery}' 지역을 찾을 수 없습니다.`);
    }

    const seen = new Set<string>();
    const merged: AedMarkerShell[] = [];

    for (const region of candidates.slice(0, 2)) {
      const batch = await fetchAedShellPage(region, 1);
      for (const item of batch) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
      }
    }

    const filtered = merged.filter((item) =>
      matchesAddressQuery(
        { buildAddress: item.name, buildPlace: item.name, org: item.name },
        addressQuery,
      ),
    );

    return (filtered.length > 0 ? filtered : merged).slice(0, maxResults);
  }

  const { coordinate, region } = await resolveSearchContext(options);
  const radiusMeters = options.radiusMeters ?? DEFAULT_AED_RADIUS_METERS;

  const shells = await fetchAedShellPage(region, 1);

  return enrichShellsWithDistance(shells, coordinate)
    .filter((item) => item.distanceM <= radiusMeters)
    .slice(0, maxResults);
}

/** AED 마커 껍데기 → 상세 UI용 최소 레코드 (API 실패 시 Fallback) */
export function buildAedLocationFromShell(shell: AedMarkerShell): AedLocationItem {
  return {
    serialSeq: shell.id,
    org: shell.name,
    buildPlace: shell.name,
    buildAddress: '',
    latitude: shell.latitude,
    longitude: shell.longitude,
    distanceM: shell.distanceM,
    walkMin: shell.walkMin,
    model: '',
    manufacturer: '',
    managerTel: '',
    clerkTel: '',
    available24h: false,
  };
}

export function mergeAedDetailWithShell(
  shell: AedMarkerShell,
  detail: AedLocationItem | null,
): AedLocationItem {
  const preview = buildAedLocationFromShell(shell);
  if (!detail) return preview;

  return {
    ...preview,
    ...detail,
    org: detail.org || preview.org,
    buildPlace: detail.buildPlace || preview.buildPlace,
    buildAddress: detail.buildAddress || preview.buildAddress,
    latitude: Number.isFinite(detail.latitude) ? detail.latitude : preview.latitude,
    longitude: Number.isFinite(detail.longitude) ? detail.longitude : preview.longitude,
    distanceM: shell.distanceM > 0 ? shell.distanceM : detail.distanceM,
    walkMin: shell.walkMin > 0 ? shell.walkMin : detail.walkMin,
  };
}

async function resolveAedDetailRegions(
  options: AedListOptions = {},
): Promise<{ coordinate: GeoCoordinate; regions: LocationRegion[] }> {
  const regions: LocationRegion[] = [];
  const seen = new Set<string>();

  const pushRegion = (region: LocationRegion | null | undefined) => {
    if (!region?.stage1) return;
    const key = `${region.stage1}|${region.stage2 ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    regions.push(region);
  };

  const addressQuery = options.addressQuery?.trim();
  if (addressQuery) {
    const candidates = options.region
      ? [options.region]
      : await resolveRegionCandidatesFromAddressQuery(addressQuery);
    for (const candidate of candidates.slice(0, 3)) {
      pushRegion(candidate);
    }
  }

  if (options.markerCoordinate) {
    pushRegion(await resolveRegionFromCoordinate(options.markerCoordinate));
  }

  pushRegion(options.region);

  const { coordinate, region } = await resolveSearchContext(options);
  pushRegion(region);

  return {
    coordinate: options.markerCoordinate ?? coordinate,
    regions: regions.length > 0 ? regions : [region],
  };
}

/** 2단계 — AED 마커 클릭 시 상세 (ID 기반 개별 조회) */
export async function fetchAedDetail(
  markerId: string,
  options: AedListOptions = {},
): Promise<AedLocationItem> {
  const cacheKey = `aed:${markerId}:${options.markerCoordinate?.latitude ?? 'x'}:${options.markerCoordinate?.longitude ?? 'x'}`;
  const cached = markerDetailCache.get(cacheKey);
  if (cached) return cached as AedLocationItem;

  const { coordinate, regions } = await resolveAedDetailRegions(options);

  for (const region of regions) {
    for (let pageNo = 1; pageNo <= DETAIL_SEARCH_MAX_PAGES; pageNo += 1) {
      const url = buildPortalUrl(AED_LOCATION_ENDPOINT, {
        Q0: region.stage1,
        Q1: region.stage2 || undefined,
        pageNo,
        numOfRows: SHELL_PAGE_SIZE,
      });
      const { rawText, contentType } = await fetchPortalRaw(url);
      const payload = parsePortalPayload(rawText, contentType);

      let found: AedLocationItem | null = null;

      if (typeof payload === 'string') {
        const { resultCode, resultMsg } = readXmlHeader(payload);
        assertApiSuccess(resultCode, resultMsg, 'AED 상세 API');
        for (const block of extractXmlItemBlocks(payload)) {
          const rnum = readXmlTag(block, 'rnum') ?? '';
          const serialSeq = readXmlTag(block, 'serialSeq') ?? '';
          if (rnum !== markerId && serialSeq !== markerId) continue;
          found = mapAedBlock(block);
          if (found) break;
        }
      } else {
        const { resultCode, resultMsg } = readJsonHeader(payload);
        assertApiSuccess(resultCode, resultMsg, 'AED 상세 API');
        for (const record of unwrapJsonItems(payload)) {
          const rnum = readJsonString(record, 'rnum');
          const serialSeq = readJsonString(record, 'serialSeq');
          if (rnum !== markerId && serialSeq !== markerId) continue;
          found = mapAedRecord(record);
          if (found) break;
        }
      }

      if (found) {
        const distanceM = calculateDistanceMeters(coordinate, {
          latitude: found.latitude,
          longitude: found.longitude,
        });
        const detail: AedLocationItem = {
          ...found,
          org: found.org || found.buildPlace,
          distanceM,
          walkMin: estimateWalkMinutes(distanceM),
        };
        markerDetailCache.set(cacheKey, detail);
        return detail;
      }

      const pageCount =
        typeof payload === 'string'
          ? extractXmlItemBlocks(payload).length
          : unwrapJsonItems(payload).length;
      if (pageCount < SHELL_PAGE_SIZE) break;
    }
  }

  throw new EmergencyApiError('AED 상세 정보를 불러오지 못했습니다.');
}

// ── 응급실 껍데기 파서 (dutyName, wgs84Lat, wgs84Lon, hpid만) ──

function mapHospitalShellBlock(block: string): HospitalMarkerShell | null {
  const hpid = readXmlTag(block, 'hpid') ?? '';
  const name = readXmlTag(block, 'dutyName') ?? readXmlTag(block, 'dutyname') ?? '';
  const latitude = parseNumeric(readXmlTag(block, 'wgs84Lat'));
  const longitude = parseNumeric(readXmlTag(block, 'wgs84Lon'));

  if (!hpid || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    name: name || '병원',
    latitude,
    longitude,
    distanceM: 0,
    walkMin: 0,
    distanceKm: 0,
    availableErBeds: 0,
    availablePediatricErBeds: 0,
    status: 'full',
    isPediatricPriority: false,
  };
}

function mapHospitalShellRecord(record: Record<string, unknown>): HospitalMarkerShell | null {
  const hpid = readJsonString(record, 'hpid');
  const name = readJsonString(record, 'dutyName', 'dutyname') || '병원';
  const latitude = parseNumeric(readJsonString(record, 'wgs84Lat'));
  const longitude = parseNumeric(readJsonString(record, 'wgs84Lon'));

  if (!hpid || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    name,
    latitude,
    longitude,
    distanceM: 0,
    walkMin: 0,
    distanceKm: 0,
    availableErBeds: 0,
    availablePediatricErBeds: 0,
    status: 'full',
    isPediatricPriority: false,
  };
}

function parseHospitalShellResponse(
  rawText: string,
  contentType: string | null,
): HospitalMarkerShell[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '응급실 껍데기 API');
    return extractXmlItemBlocks(payload)
      .map(mapHospitalShellBlock)
      .filter((item): item is HospitalMarkerShell => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '응급실 껍데기 API');
  return unwrapJsonItems(payload)
    .map(mapHospitalShellRecord)
    .filter((item): item is HospitalMarkerShell => item !== null);
}

/** 1단계 — 응급실 마커 (병상 API 기준 + 좌표만 위치 API에서 병합) */
export async function fetchHospitalMarkerShells(
  options: NearbyHospitalOptions = {},
): Promise<HospitalMarkerShell[]> {
  const { coordinate, region } = await resolveSearchContext(options);
  const radiusMeters = options.radiusMeters ?? DEFAULT_RADIUS_METERS;
  const maxResults = options.maxResults ?? 50;

  const [bedResponse, locationShells] = await Promise.all([
    fetchEmergencyBedInfo({
      stage1: region.stage1,
      stage2: region.stage2,
      pageNo: 1,
      numOfRows: DEFAULT_PAGE_SIZE,
    }),
    fetchHospitalLocationShells(region),
  ]);

  if (bedResponse.items.length === 0) {
    throw new EmergencyApiError(
      `${region.label} 응급실 실시간 정보가 없습니다. 잠시 후 다시 시도해 주세요.`,
    );
  }

  const locationMap = new Map(
    locationShells.map((item) => [item.hpid, item]),
  );

  const shells: HospitalMarkerShell[] = bedResponse.items.map((bed) => {
    const location = locationMap.get(bed.hpid);
    const latitude = location?.latitude ?? 0;
    const longitude = location?.longitude ?? 0;
    const hospitalName = safeDisplayText(bed.hospitalName, '병원명 미상');
    const isMoonlight = isMoonlightChildrenHospital(hospitalName);

    return {
      hpid: bed.hpid,
      name: hospitalName,
      latitude,
      longitude,
      distanceM: 0,
      walkMin: 0,
      distanceKm: 0,
      availableErBeds: parseNumeric(bed.availableErBeds),
      availablePediatricErBeds: parseNumeric(bed.availablePediatricErBeds),
      status: safeErStatus(bed.status),
      isPediatricPriority: isMoonlight || parseNumeric(bed.availablePediatricErBeds) > 0,
    };
  });

  const withCoords = shells
    .filter((item) => item.latitude !== 0 || item.longitude !== 0)
    .map((item) => {
      const distanceM = calculateDistanceMeters(coordinate, {
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return {
        ...item,
        distanceM,
        walkMin: estimateWalkMinutes(distanceM),
        distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
      };
    })
    .filter((item) => item.distanceM <= radiusMeters);

  const withoutCoords = shells.filter(
    (item) => item.latitude === 0 && item.longitude === 0,
  );

  const merged =
    withCoords.length > 0
      ? [...sortHospitalMarkerShells(withCoords), ...withoutCoords]
      : sortHospitalMarkerShells(shells);

  return merged.slice(0, maxResults);
}

async function fetchHospitalLocationShells(
  region: LocationRegion,
): Promise<Array<{ hpid: string; latitude: number; longitude: number }>> {
  const results: Array<{ hpid: string; latitude: number; longitude: number }> = [];
  const maxPages = 3;

  for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
    const url = buildPortalUrl(HOSPITAL_LOCATION_ENDPOINT, {
      Q0: region.stage1,
      Q1: region.stage2,
      pageNo,
      numOfRows: SHELL_PAGE_SIZE,
    });
    const { rawText, contentType } = await fetchPortalRaw(url);
    const shells = parseHospitalShellResponse(rawText, contentType);
    for (const shell of shells) {
      results.push({
        hpid: shell.hpid,
        latitude: shell.latitude,
        longitude: shell.longitude,
      });
    }
    if (shells.length < SHELL_PAGE_SIZE) break;
  }

  return results;
}

function sortHospitalMarkerShells(items: HospitalMarkerShell[]): HospitalMarkerShell[] {
  const pediatric: HospitalMarkerShell[] = [];
  const regular: HospitalMarkerShell[] = [];

  for (const item of items) {
    if (item.isPediatricPriority) {
      pediatric.push(item);
    } else {
      regular.push(item);
    }
  }

  const byDistance = (a: HospitalMarkerShell, b: HospitalMarkerShell) => a.distanceM - b.distanceM;
  pediatric.sort(byDistance);
  regular.sort(byDistance);

  return [...pediatric, ...regular];
}

function buildHospitalDetail(
  location: HospitalLocationItem,
  bed: EmergencyBedItem | null,
  coordinate: GeoCoordinate,
): HospitalDetail {
  const lat = parseNumeric(location.latitude);
  const lon = parseNumeric(location.longitude);
  const distanceM = calculateDistanceMeters(coordinate, { latitude: lat, longitude: lon });

  const mergedBed: EmergencyBedItem =
    bed ??
    sanitizeEmergencyBedItem({
      rnum: 0,
      hpid: location.hpid,
      phpid: location.hpid,
      hospitalName: location.hospitalName,
      erPhone: location.erPhone,
      updatedAt: '',
      availableErBeds: 0,
      availablePediatricErBeds: 0,
      availableSurgeryBeds: 0,
      availableNeuroIcuBeds: 0,
      availableNeonatalIcuBeds: 0,
      availableChestIcuBeds: 0,
      availableGeneralIcuBeds: 0,
      availableInpatientBeds: 0,
      onCallDoctor: '',
      ctAvailable: false,
      mriAvailable: false,
      angioAvailable: false,
      ventilatorAvailable: false,
      ambulanceAvailable: false,
      erDoctorPhone: '',
      pediatricDoctorPhone: '',
      status: 'full',
      icuInternalMedicineBeds: 0,
      icuSurgeryBeds: 0,
      icuOrthopedicBeds: 0,
      icuNeurologyBeds: 0,
      icuNeurosurgeryBeds: 0,
      icuToxicologyBeds: 0,
      icuBurnBeds: 0,
      icuTraumaBeds: 0,
      pediatricVentilatorAvailable: false,
      incubatorAvailable: false,
    });

  const hospitalName = safeDisplayText(mergedBed.hospitalName || location.hospitalName, '병원명 미상');
  const isMoonlight = isMoonlightChildrenHospital(hospitalName);

  return {
    ...mergedBed,
    ...location,
    latitude: lat,
    longitude: lon,
    hospitalName,
    erPhone: safeDisplayText(mergedBed.erPhone || location.erPhone, '-'),
    phone: safeDisplayText(location.phone, '-'),
    emergencyClassName: safeDisplayText(location.emergencyClassName, '응급의학과'),
    address: safeDisplayText(location.address, '-'),
    distanceM,
    distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
    walkMin: estimateWalkMinutes(distanceM),
    isMoonlightHospital: isMoonlight,
    isPediatricPriority: isMoonlight || parseNumeric(mergedBed.availablePediatricErBeds) > 0,
    description: location.description ?? '',
    specialties: parseSpecialtyTags(location.emergencyClassName, location.description),
    weeklySchedule: [],
    isOpenNow: false,
    openStatusLabel: '확인 필요',
  };
}

function mergeHospitalDetailWithBasis(
  detail: HospitalDetail,
  basis: EmergencyHospitalBasisInfo | null,
): HospitalDetail {
  if (!basis) return detail;

  return {
    ...detail,
    hospitalName: safeDisplayText(basis.hospitalName, detail.hospitalName),
    address: basis.address || detail.address,
    phone: basis.phone || detail.phone,
    erPhone: basis.erPhone || detail.erPhone,
    emergencyClassName: basis.emergencyClassName || detail.emergencyClassName,
    description: basis.description || detail.description,
    specialties: basis.specialties.length ? basis.specialties : detail.specialties,
    weeklySchedule: basis.weeklySchedule.length ? basis.weeklySchedule : detail.weeklySchedule,
    isOpenNow: basis.isOpenNow,
    openStatusLabel: basis.openStatusLabel,
    latitude: basis.latitude || detail.latitude,
    longitude: basis.longitude || detail.longitude,
  };
}

/** 2단계 — 응급실 마커 클릭 시 상세 (hpid 기반 병상+위치+기본정보 병합) */
export async function fetchHospitalDetail(
  hpid: string,
  options: NearbyHospitalOptions = {},
): Promise<HospitalDetail> {
  const cacheKey = `er:${hpid}:detail`;
  const cached = markerDetailCache.get(cacheKey);
  if (cached) return cached as HospitalDetail;

  const { coordinate, region } = await resolveSearchContext(options);

  let bed: EmergencyBedItem | null = null;
  try {
    const bedResponse = await fetchEmergencyBedInfo({
      stage1: region.stage1,
      stage2: region.stage2,
      pageNo: 1,
      numOfRows: DEFAULT_PAGE_SIZE,
    });
    bed = bedResponse.items.find((item) => item.hpid === hpid) ?? null;
  } catch (error) {
    console.error('[ER API] fetchHospitalDetail bed lookup failed', { hpid, error });
  }

  let location: HospitalLocationItem | null = null;

  try {
    for (let pageNo = 1; pageNo <= DETAIL_SEARCH_MAX_PAGES; pageNo += 1) {
      const url = buildPortalUrl(HOSPITAL_LOCATION_ENDPOINT, {
        Q0: region.stage1,
        Q1: region.stage2,
        pageNo,
        numOfRows: SHELL_PAGE_SIZE,
      });
      const { rawText, contentType } = await fetchPortalRaw(url);
      const items = parseHospitalLocationResponse(rawText, contentType);
      location = items.find((item) => item.hpid === hpid) ?? null;
      if (location) break;
      if (items.length < SHELL_PAGE_SIZE) break;
    }
  } catch (error) {
    console.error('[ER API] fetchHospitalDetail location lookup failed', { hpid, error });
  }

  if (!location && bed) {
    location = {
      hpid,
      hospitalName: bed.hospitalName,
      address: '',
      erPhone: bed.erPhone,
      phone: '',
      latitude: 0,
      longitude: 0,
      emergencyClass: '',
      emergencyClassName: '',
      description: '',
    };
  }

  if (!location) {
    throw new EmergencyApiError('응급실 상세 정보를 불러오지 못했습니다.');
  }

  const basis = await fetchEmergencyHospitalBasis(hpid, region);
  const detail = mergeHospitalDetailWithBasis(
    buildHospitalDetail(location, bed, coordinate),
    basis,
  );
  markerDetailCache.set(cacheKey, detail);
  return detail;
}

// ── 약국 껍데기 파서 (dutyName, wgs84Lat, wgs84Lon, hpid만) ──

function mapPharmacyShellBlock(block: string): PharmacyMarkerShell | null {
  const hpid = readXmlTag(block, 'hpid') ?? '';
  const name = readXmlTag(block, 'dutyName') ?? readXmlTag(block, 'dutyname') ?? '';
  const latitude = parseNumeric(readXmlTag(block, 'wgs84Lat'));
  const longitude = parseNumeric(readXmlTag(block, 'wgs84Lon'));

  if (!hpid || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    name: name || '약국',
    latitude,
    longitude,
    distanceM: 0,
    walkMin: 0,
    distanceKm: 0,
  };
}

function mapPharmacyShellRecord(record: Record<string, unknown>): PharmacyMarkerShell | null {
  const hpid = readJsonString(record, 'hpid');
  const name = readJsonString(record, 'dutyName', 'dutyname') || '약국';
  const latitude = parseNumeric(readJsonString(record, 'wgs84Lat'));
  const longitude = parseNumeric(readJsonString(record, 'wgs84Lon'));

  if (!hpid || (latitude === 0 && longitude === 0)) return null;

  return {
    hpid,
    name,
    latitude,
    longitude,
    distanceM: 0,
    walkMin: 0,
    distanceKm: 0,
  };
}

function parsePharmacyShellResponse(
  rawText: string,
  contentType: string | null,
): PharmacyMarkerShell[] {
  const payload = parsePortalPayload(rawText, contentType);

  if (typeof payload === 'string') {
    const { resultCode, resultMsg } = readXmlHeader(payload);
    assertApiSuccess(resultCode, resultMsg, '약국 껍데기 API');
    return extractXmlItemBlocks(payload)
      .map(mapPharmacyShellBlock)
      .filter((item): item is PharmacyMarkerShell => item !== null);
  }

  const { resultCode, resultMsg } = readJsonHeader(payload);
  assertApiSuccess(resultCode, resultMsg, '약국 껍데기 API');
  return unwrapJsonItems(payload)
    .map(mapPharmacyShellRecord)
    .filter((item): item is PharmacyMarkerShell => item !== null);
}

/** 1단계 — 약국 마커 껍데기 (진료시간 파싱 생략) */
export async function fetchPharmacyMarkerShells(
  options: NearbyPharmacyOptions = {},
): Promise<PharmacyMarkerShell[]> {
  const { coordinate, region } = await resolveSearchContext(options);
  const radiusMeters = options.radiusMeters ?? DEFAULT_RADIUS_METERS;
  const maxResults = options.maxResults ?? 40;

  const coordUrl = buildPortalUrl(PHARMACY_LOCATION_ENDPOINT, {
    WGS84LAT: coordinate.latitude,
    WGS84LON: coordinate.longitude,
    pageNo: 1,
    numOfRows: SHELL_PAGE_SIZE,
  });

  let shells: PharmacyMarkerShell[] = [];

  try {
    const { rawText, contentType } = await fetchPortalRaw(coordUrl);
    shells = parsePharmacyShellResponse(rawText, contentType);
  } catch {
    shells = [];
  }

  if (shells.length === 0) {
    const regionUrl = buildPortalUrl(PHARMACY_LIST_ENDPOINT, {
      Q0: region.stage1,
      Q1: region.stage2,
      QT: options.holidayKeeper ? 8 : getTreatmentDayCode(),
      pageNo: 1,
      numOfRows: SHELL_PAGE_SIZE,
    });
    const { rawText, contentType } = await fetchPortalRaw(regionUrl);
    shells = parsePharmacyShellResponse(rawText, contentType);
  }

  return enrichShellsWithDistance(shells, coordinate)
    .filter((item) => item.distanceM <= radiusMeters)
    .slice(0, maxResults);
}

/** 2단계 — 약국 마커 클릭 시 상세 (hpid + 좌표 기반) */
export async function fetchPharmacyDetail(
  hpid: string,
  options: NearbyPharmacyOptions & { markerCoordinate?: GeoCoordinate } = {},
): Promise<PharmacyInfo> {
  const cacheKey = `pharmacy:${hpid}`;
  const cached = markerDetailCache.get(cacheKey);
  if (cached) return cached as PharmacyInfo;

  const { coordinate, region } = await resolveSearchContext(options);
  const lookupCoordinate = options.markerCoordinate ?? coordinate;
  const dayCode = options.holidayKeeper ? 8 : getTreatmentDayCode();

  const coordUrl = buildPortalUrl(PHARMACY_LOCATION_ENDPOINT, {
    WGS84LAT: lookupCoordinate.latitude,
    WGS84LON: lookupCoordinate.longitude,
    pageNo: 1,
    numOfRows: SHELL_PAGE_SIZE,
  });

  let items: PharmacyInfo[] = [];

  try {
    const { rawText, contentType } = await fetchPortalRaw(coordUrl);
    items = parsePharmacyListResponse(rawText, contentType, dayCode);
  } catch {
    items = [];
  }

  let found = items.find((item) => item.hpid === hpid) ?? null;

  if (!found) {
    const regionUrl = buildPortalUrl(PHARMACY_LIST_ENDPOINT, {
      Q0: region.stage1,
      Q1: region.stage2,
      QT: dayCode,
      pageNo: 1,
      numOfRows: SHELL_PAGE_SIZE,
    });
    const { rawText, contentType } = await fetchPortalRaw(regionUrl);
    items = parsePharmacyListResponse(rawText, contentType, dayCode);
    found = items.find((item) => item.hpid === hpid) ?? null;
  }

  if (!found) {
    throw new EmergencyApiError('약국 상세 정보를 불러오지 못했습니다.');
  }

  const distanceM = calculateDistanceMeters(coordinate, {
    latitude: found.latitude,
    longitude: found.longitude,
  });

  const detail: PharmacyInfo = {
    ...found,
    distanceM,
    distanceKm: Number((distanceM / 1000).toFixed(1)) || 0,
    walkMin: estimateWalkMinutes(distanceM),
  };

  markerDetailCache.set(cacheKey, detail);
  return detail;
}
