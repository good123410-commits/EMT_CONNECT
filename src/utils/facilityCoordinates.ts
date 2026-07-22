/** 한국 영역 대략 경계 */
const KOREA_LAT_MIN = 33;
const KOREA_LAT_MAX = 39.5;
const KOREA_LNG_MIN = 124;
const KOREA_LNG_MAX = 132;

export type FacilityCoordInput = {
  lat?: number | string | null;
  lng?: number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  x?: number | string | null;
  y?: number | string | null;
};

function toNumber(value: number | string | null | undefined): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function isKoreaLat(value: number): boolean {
  return value >= KOREA_LAT_MIN && value <= KOREA_LAT_MAX;
}

function isKoreaLng(value: number): boolean {
  return value >= KOREA_LNG_MIN && value <= KOREA_LNG_MAX;
}

/** 공공데이터 좌표(X)=경도, 좌표(Y)=위도 — 뒤바뀐 값 자동 보정 */
export function resolveFacilityLatLng(input: FacilityCoordInput): { lat: number; lng: number } | null {
  const x = toNumber(input.x);
  const y = toNumber(input.y);
  const lat = toNumber(input.lat ?? input.latitude);
  const lng = toNumber(input.lng ?? input.longitude);

  let resolvedLat = lat;
  let resolvedLng = lng;

  if ((!resolvedLat || !resolvedLng) && x && y) {
    resolvedLng = x;
    resolvedLat = y;
  }

  if (isKoreaLng(resolvedLat) && isKoreaLat(resolvedLng)) {
    return { lat: resolvedLng, lng: resolvedLat };
  }

  if (isKoreaLat(resolvedLat) && isKoreaLng(resolvedLng)) {
    return { lat: resolvedLat, lng: resolvedLng };
  }

  return null;
}

export function isValidKoreaCoordinate(lat: number, lng: number): boolean {
  return isKoreaLat(lat) && isKoreaLng(lng) && !(lat === 0 && lng === 0);
}
