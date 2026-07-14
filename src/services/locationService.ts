import * as Location from 'expo-location';

export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

export type LocationRegion = {
  stage1: string;
  stage2: string;
  label: string;
};

export type LocationSnapshot = {
  coordinate: GeoCoordinate;
  region: LocationRegion;
  permissionGranted: boolean;
};

export class LocationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

const DEFAULT_COORDINATE: GeoCoordinate = {
  latitude: 37.5665,
  longitude: 126.978,
};

const DEFAULT_REGION: LocationRegion = {
  stage1: '서울특별시',
  stage2: '중구',
  label: '서울특별시 중구',
};

const LOCATION_CACHE_TTL_MS = 60_000;

let cachedSnapshot: LocationSnapshot | null = null;
let cacheTimestamp = 0;
let refreshPromise: Promise<LocationSnapshot> | null = null;
const listeners = new Set<(snapshot: LocationSnapshot) => void>();

const SIDO_SUFFIXES = ['특별자치도', '특별자치시', '특별시', '광역시', '자치시', '도'] as const;

export const SIDO_LIST: readonly string[] = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
] as const;

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

function normalizeSido(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_REGION.stage1;
  if (SIDO_SUFFIXES.some((suffix) => trimmed.endsWith(suffix))) return trimmed;

  for (const [key, value] of Object.entries(SIDO_ALIAS_MAP)) {
    if (trimmed.startsWith(key)) return value;
  }

  return trimmed;
}

function pickRegionParts(address: Location.LocationGeocodedAddress): LocationRegion {
  const stage1 = normalizeSido(address.region ?? address.city ?? address.subregion ?? '');
  const stage2 = (address.district ?? address.subregion ?? address.city ?? '').trim();

  if (!stage2) {
    return { stage1, stage2: '', label: stage1 };
  }

  return {
    stage1,
    stage2,
    label: `${stage1} ${stage2}`,
  };
}

function getDefaultSnapshot(): LocationSnapshot {
  return {
    coordinate: { ...DEFAULT_COORDINATE },
    region: { ...DEFAULT_REGION },
    permissionGranted: false,
  };
}

function notifyListeners(snapshot: LocationSnapshot) {
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function isCacheFresh(): boolean {
  return cachedSnapshot !== null && Date.now() - cacheTimestamp < LOCATION_CACHE_TTL_MS;
}

export async function requestLocationPermission(): Promise<Location.PermissionStatus> {
  const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
  if (existingStatus === Location.PermissionStatus.GRANTED) {
    return existingStatus;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

export async function getCurrentCoordinates(): Promise<GeoCoordinate> {
  const status = await requestLocationPermission();

  if (status !== Location.PermissionStatus.GRANTED) {
    throw new LocationServiceError('위치 권한이 필요합니다. 설정에서 위치 접근을 허용해 주세요.');
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) {
    return {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
    };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export async function resolveRegionFromCoordinate(
  coordinate: GeoCoordinate,
): Promise<LocationRegion> {
  try {
    const results = await Location.reverseGeocodeAsync(coordinate);
    const first = results[0];
    if (first) {
      return pickRegionParts(first);
    }
  } catch {
    // reverse geocode 실패 시 기본 지역으로 대체
  }

  return DEFAULT_REGION;
}

async function fetchFreshLocation(): Promise<LocationSnapshot> {
  try {
    const status = await requestLocationPermission();
    if (status !== Location.PermissionStatus.GRANTED) {
      return getDefaultSnapshot();
    }

    const lastKnown = await Location.getLastKnownPositionAsync();
    let coordinate: GeoCoordinate;

    if (lastKnown) {
      coordinate = {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    } else {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }

    const region = await resolveRegionFromCoordinate(coordinate);
    return { coordinate, region, permissionGranted: true };
  } catch {
    return getDefaultSnapshot();
  }
}

/** 앱 시작 시 백그라운드에서 위치 캐시를 미리 채움 */
export function warmUpLocationCache(): void {
  void refreshLocationCache();
}

/** 캐시를 갱신하고 구독자에게 알림 */
export async function refreshLocationCache(): Promise<LocationSnapshot> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetchFreshLocation()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      cacheTimestamp = Date.now();
      notifyListeners(snapshot);
      return snapshot;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/** 위치 갱신 구독 — 즉시 기본값 전달 후 GPS 확정 시 콜백 */
export function subscribeToLocationUpdates(
  callback: (snapshot: LocationSnapshot) => void,
): () => void {
  listeners.add(callback);
  callback(cachedSnapshot ?? getDefaultSnapshot());
  void refreshLocationCache();
  return () => listeners.delete(callback);
}

export async function getLocationWithRegion(): Promise<LocationSnapshot> {
  if (isCacheFresh() && cachedSnapshot) {
    return cachedSnapshot;
  }

  return refreshLocationCache();
}

/** 블로킹 없이 즉시 기본/캐시 좌표 반환 + 백그라운드 GPS 갱신 */
export function getLocationWithRegionImmediate(): LocationSnapshot {
  if (isCacheFresh() && cachedSnapshot) {
    return cachedSnapshot;
  }

  void refreshLocationCache();
  return cachedSnapshot ?? getDefaultSnapshot();
}

export function getDefaultCoordinate(): GeoCoordinate {
  return { ...DEFAULT_COORDINATE };
}

export function getDefaultRegion(): LocationRegion {
  return { ...DEFAULT_REGION };
}

/** 전국 지역명 검색용 — 시도/시군구 매핑 (AED·응급실 주소 검색) */
const REGION_SEARCH_ALIASES: Record<string, LocationRegion> = {
  서울: { stage1: '서울특별시', stage2: '', label: '서울특별시' },
  부산: { stage1: '부산광역시', stage2: '', label: '부산광역시' },
  대구: { stage1: '대구광역시', stage2: '', label: '대구광역시' },
  인천: { stage1: '인천광역시', stage2: '', label: '인천광역시' },
  광주: { stage1: '광주광역시', stage2: '', label: '광주광역시' },
  대전: { stage1: '대전광역시', stage2: '', label: '대전광역시' },
  울산: { stage1: '울산광역시', stage2: '', label: '울산광역시' },
  세종: { stage1: '세종특별자치시', stage2: '세종특별자치시', label: '세종특별자치시' },
  목포: { stage1: '전라남도', stage2: '목포시', label: '전라남도 목포시' },
  여수: { stage1: '전라남도', stage2: '여수시', label: '전라남도 여수시' },
  순천: { stage1: '전라남도', stage2: '순천시', label: '전라남도 순천시' },
  전주: { stage1: '전북특별자치도', stage2: '전주시', label: '전북특별자치도 전주시' },
  제주: { stage1: '제주특별자치도', stage2: '제주시', label: '제주특별자치도 제주시' },
  수원: { stage1: '경기도', stage2: '수원시', label: '경기도 수원시' },
  성남: { stage1: '경기도', stage2: '성남시', label: '경기도 성남시' },
  고양: { stage1: '경기도', stage2: '고양시', label: '경기도 고양시' },
  창원: { stage1: '경상남도', stage2: '창원시', label: '경상남도 창원시' },
  포항: { stage1: '경상북도', stage2: '포항시', label: '경상북도 포항시' },
  강남: { stage1: '서울특별시', stage2: '강남구', label: '서울특별시 강남구' },
  해운대: { stage1: '부산광역시', stage2: '해운대구', label: '부산광역시 해운대구' },
};

function matchRegionAlias(query: string): LocationRegion | null {
  const normalized = query.trim().replace(/\s+/g, '');
  if (!normalized) return null;

  for (const [key, region] of Object.entries(REGION_SEARCH_ALIASES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { ...region };
    }
  }

  for (const region of Object.values(REGION_SEARCH_ALIASES)) {
    if (region.stage1.includes(normalized) || region.stage2.includes(normalized)) {
      return { ...region };
    }
  }

  return null;
}

/** 자유 텍스트에서 시도/시군구 추출 */
function parseRegionFromFreeText(query: string): LocationRegion | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  let stage1 = '';
  let remainder = trimmed;

  for (const sido of SIDO_LIST) {
    if (trimmed.includes(sido)) {
      stage1 = sido;
      remainder = trimmed.replace(sido, '').trim();
      break;
    }
  }

  if (!stage1) {
    for (const [alias, full] of Object.entries(SIDO_ALIAS_MAP)) {
      if (trimmed.startsWith(alias) || trimmed.includes(alias)) {
        stage1 = full;
        remainder = trimmed.replace(alias, '').trim();
        break;
      }
    }
  }

  if (!stage1) return null;

  const sigunguMatch = remainder.match(
    /^([\S]+(?:시|군|구))(?:\s+([\S]+(?:읍|면|동|리|가)))?/,
  );
  const stage2 = sigunguMatch?.[1]?.trim() ?? '';
  const dong = sigunguMatch?.[2]?.trim() ?? '';

  const label = [stage1, stage2, dong].filter(Boolean).join(' ');
  return { stage1, stage2, label: label || stage1 };
}

/** 검색창 지역명 → API Q0/Q1 파라미터용 LocationRegion (단일) */
export async function resolveRegionFromAddressQuery(query: string): Promise<LocationRegion | null> {
  const candidates = await resolveRegionCandidatesFromAddressQuery(query);
  return candidates[0] ?? null;
}

/** 검색어에 맞는 Q0/Q1 후보 목록 (전국 주소 검색용) */
export async function resolveRegionCandidatesFromAddressQuery(
  query: string,
): Promise<LocationRegion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const seen = new Set<string>();
  const candidates: LocationRegion[] = [];

  const addCandidate = (region: LocationRegion | null | undefined) => {
    if (!region?.stage1) return;
    const key = `${region.stage1}|${region.stage2}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ ...region, label: region.label || `${region.stage1} ${region.stage2}`.trim() });
  };

  addCandidate(matchRegionAlias(trimmed));
  addCandidate(parseRegionFromFreeText(trimmed));

  try {
    const results = await Location.geocodeAsync(`${trimmed}, 대한민국`);
    for (const result of results.slice(0, 3)) {
      addCandidate(pickRegionParts(result));
    }
  } catch {
    // geocode 실패 — 파싱/별칭 결과만 사용
  }

  const parsed = parseRegionFromFreeText(trimmed);
  if (parsed?.stage1) {
    addCandidate({ stage1: parsed.stage1, stage2: '', label: parsed.stage1 });
  }

  if (candidates.length === 0) {
    for (const sido of SIDO_LIST) {
      const short = sido.replace(/특별|광역|자치/g, '').slice(0, 2);
      if (trimmed.includes(short) || trimmed.includes(sido)) {
        addCandidate({ stage1: sido, stage2: '', label: sido });
      }
    }
  }

  return candidates;
}

/** AED 주소 텍스트 매칭 — 읍/면/동·상세주소 포함 */
export function matchesAddressQuery(
  item: { buildAddress: string; buildPlace: string; org: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  const haystack = `${item.buildAddress} ${item.buildPlace} ${item.org}`.toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}
