import { Alert, AppState, Linking, Platform } from 'react-native';
import { KAKAO_JS_KEY } from '@/constants/kakaoMap';
import { getCurrentCoordinates, type GeoCoordinate } from '@/services/locationService';

export type KakaoDirectionsTarget = {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  /** 미리 확보된 출발지 — 없으면 길찾기 시 GPS로 자동 확보 */
  origin?: GeoCoordinate | null;
};

/** 앱 미설치·실행 실패 시 웹으로 넘기기 전 대기 시간 */
const APP_FALLBACK_TIMEOUT_MS = 1750;
const GPS_ACQUIRE_TIMEOUT_MS = 5000;

function hasValidCoordinates(latitude?: number | null, longitude?: number | null): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
}

function getPositionViaNavigatorGeolocation(): Promise<GeoCoordinate> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation API unavailable'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: false,
        timeout: GPS_ACQUIRE_TIMEOUT_MS,
        maximumAge: 60_000,
      },
    );
  });
}

/**
 * 길찾기용 현재 GPS 좌표 확보.
 * Web: navigator.geolocation → Native: expo-location (locationService)
 */
export async function acquireCurrentGpsPosition(): Promise<GeoCoordinate | null> {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      return await getPositionViaNavigatorGeolocation();
    } catch {
      // navigator 실패 시 native 폴백 시도
    }
  }

  try {
    return await getCurrentCoordinates();
  } catch {
    return null;
  }
}

/** 카카오맵 웹 길찾기 — https://map.kakao.com/link/to/장소명,위도,경도 */
export function buildKakaoMapWebDirectionsUrl(
  name: string,
  latitude: number,
  longitude: number,
): string {
  const label = name.trim() || '목적지';
  return `https://map.kakao.com/link/to/${encodeURIComponent(label)},${latitude},${longitude}`;
}

/** 출발지·목적지가 모두 있을 때 자동차 길찾기 웹 URL */
export function buildKakaoMapWebRouteUrl(
  destinationName: string,
  destinationLatitude: number,
  destinationLongitude: number,
  origin?: GeoCoordinate | null,
  originName = '현재 위치',
): string {
  const destLabel = destinationName.trim() || '목적지';
  const destSegment = `${encodeURIComponent(destLabel)},${destinationLatitude},${destinationLongitude}`;

  if (origin && hasValidCoordinates(origin.latitude, origin.longitude)) {
    const fromSegment = `${encodeURIComponent(originName.trim() || '현재 위치')},${origin.latitude},${origin.longitude}`;
    return `https://map.kakao.com/link/by/car/${fromSegment}/${destSegment}`;
  }

  return buildKakaoMapWebDirectionsUrl(destLabel, destinationLatitude, destinationLongitude);
}

export function buildKakaoMapWebSearchUrl(query: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(query.trim())}`;
}

/** 카카오맵 앱 경로 안내 (출발지 sp 선택) */
export function buildKakaoMapAppRouteUrl(
  destinationLatitude: number,
  destinationLongitude: number,
  origin?: GeoCoordinate | null,
): string {
  const ep = `${destinationLatitude},${destinationLongitude}`;
  if (origin && hasValidCoordinates(origin.latitude, origin.longitude)) {
    const sp = `${origin.latitude},${origin.longitude}`;
    return `kakaomap://route?sp=${sp}&ep=${ep}&by=CAR`;
  }
  return `kakaomap://route?ep=${ep}&by=CAR`;
}

/** 카카오내비 SDK 딥링크 (모바일 우선 시도) */
export function buildKakaoNaviSdkUrl(
  name: string,
  latitude: number,
  longitude: number,
): string {
  const param = JSON.stringify({
    destination: {
      name: name.trim() || '목적지',
      x: String(longitude),
      y: String(latitude),
    },
    option: {
      coord_type: 'wgs84',
    },
  });

  const query = new URLSearchParams({
    appkey: KAKAO_JS_KEY,
    apiver: '1.0',
    param,
  });

  return `kakaonavi-sdk://navigate?${query.toString()}`;
}

/** 카카오내비 레거시 스킴 (kakaonavi://) — 목적지만 전달, 출발지는 기기 GPS */
export function buildKakaoNaviLegacyUrl(
  name: string,
  latitude: number,
  longitude: number,
): string {
  const query = new URLSearchParams({
    dest_lat: String(latitude),
    dest_lng: String(longitude),
    dest_name: name.trim() || '목적지',
  });
  return `kakaonavi://navigate?${query.toString()}`;
}

function openWebUrl(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  void Linking.openURL(url).catch(() => {
    Alert.alert('길찾기 실패', '카카오맵을 열지 못했습니다. 잠시 후 다시 시도해 주세요.');
  });
}

type AppStateSubscription = { remove: () => void };

/**
 * 모바일: 앱 딥링크 시도 후 타임아웃 내 백그라운드 전환 여부로 실행 성공 판별.
 * @returns 외부 앱이 열린 것으로 판단되면 true
 */
function waitForExternalAppLaunch(appUrl: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;

    const settle = (opened: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);
      subscription.remove();
      resolve(opened);
    };

    const subscription: AppStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        settle(true);
      }
    });

    const fallbackTimer = setTimeout(() => settle(false), APP_FALLBACK_TIMEOUT_MS);

    void Linking.openURL(appUrl).catch(() => settle(false));
  });
}

async function openMobileDirectionsWithFallback(
  appUrls: string[],
  webUrl: string,
): Promise<void> {
  for (const appUrl of appUrls) {
    const opened = await waitForExternalAppLaunch(appUrl);
    if (opened) return;
  }

  openWebUrl(webUrl);
}

/**
 * GPS 출발지 확보 → 카카오내비/카카오맵 앱 딥링크(타이머 폴백) → 카카오맵 웹 순으로 길 안내.
 */
export async function openKakaoMapDirections(target: KakaoDirectionsTarget): Promise<void> {
  const name = target.name.trim() || '목적지';
  const address = target.address?.trim() || '';
  const hasCoords = hasValidCoordinates(target.latitude, target.longitude);

  const origin = target.origin ?? (await acquireCurrentGpsPosition());

  if (hasCoords) {
    const latitude = target.latitude as number;
    const longitude = target.longitude as number;
    const webUrl = buildKakaoMapWebRouteUrl(name, latitude, longitude, origin);

    if (Platform.OS === 'web') {
      openWebUrl(webUrl);
      return;
    }

    const appUrls = [
      buildKakaoNaviSdkUrl(name, latitude, longitude),
      buildKakaoNaviLegacyUrl(name, latitude, longitude),
      buildKakaoMapAppRouteUrl(latitude, longitude, origin),
    ];

    await openMobileDirectionsWithFallback(appUrls, webUrl);
    return;
  }

  if (address) {
    const searchWebUrl = buildKakaoMapWebSearchUrl(address);
    const searchAppUrl = `kakaomap://search?q=${encodeURIComponent(address)}`;

    if (Platform.OS === 'web') {
      openWebUrl(searchWebUrl);
      return;
    }

    const opened = await waitForExternalAppLaunch(searchAppUrl);
    if (!opened) {
      openWebUrl(searchWebUrl);
    }
    return;
  }

  Alert.alert('길찾기 불가', '위치 좌표 또는 주소 정보가 없습니다.');
}

/** @alias openKakaoMapDirections */
export const openKakaoNavi = openKakaoMapDirections;

/** @deprecated openKakaoMapDirections 사용 */
export function openMapDirections(address: string): void {
  void openKakaoMapDirections({ name: address, address });
}
