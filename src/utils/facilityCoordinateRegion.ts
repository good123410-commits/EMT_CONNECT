import { calculateDistanceMeters } from '@/services/emergencyApi';
import type { GeoCoordinate } from '@/services/locationService';
import { canonicalizeStage1 } from '@/utils/facilityAddressRegion';
import type { MapBounds } from '@/utils/mapViewport';
import { isValidCoordinate } from '@/utils/mapViewport';

/** 시·도 단위 대략적 경계 (WGS84) — 주소 없는 좌표 전용 시설(AED 등) 필터용 */
export const SIDO_COORDINATE_BOUNDS: Record<string, MapBounds> = {
  서울특별시: { minLat: 37.413, maxLat: 37.715, minLng: 126.734, maxLng: 127.269 },
  부산광역시: { minLat: 34.88, maxLat: 35.4, minLng: 128.74, maxLng: 129.32 },
  대구광역시: { minLat: 35.68, maxLat: 36.02, minLng: 128.35, maxLng: 128.78 },
  인천광역시: { minLat: 37.26, maxLat: 37.77, minLng: 126.37, maxLng: 126.89 },
  광주광역시: { minLat: 35.07, maxLat: 35.25, minLng: 126.68, maxLng: 127.0 },
  대전광역시: { minLat: 36.22, maxLat: 36.48, minLng: 127.3, maxLng: 127.54 },
  울산광역시: { minLat: 35.33, maxLat: 35.7, minLng: 129.02, maxLng: 129.52 },
  세종특별자치시: { minLat: 36.42, maxLat: 36.6, minLng: 127.21, maxLng: 127.37 },
  경기도: { minLat: 36.89, maxLat: 38.31, minLng: 126.37, maxLng: 127.86 },
  강원특별자치도: { minLat: 37.02, maxLat: 38.61, minLng: 127.05, maxLng: 129.46 },
  충청북도: { minLat: 36.26, maxLat: 37.22, minLng: 127.28, maxLng: 128.46 },
  충청남도: { minLat: 35.97, maxLat: 37.06, minLng: 126.08, maxLng: 127.68 },
  전북특별자치도: { minLat: 35.2, maxLat: 36.19, minLng: 126.37, maxLng: 127.98 },
  전라남도: { minLat: 34.21, maxLat: 35.73, minLng: 125.99, maxLng: 127.59 },
  경상북도: { minLat: 35.67, maxLat: 37.52, minLng: 127.98, maxLng: 129.61 },
  경상남도: { minLat: 34.69, maxLat: 35.9, minLng: 127.57, maxLng: 129.3 },
  제주특별자치도: { minLat: 33.19, maxLat: 33.57, minLng: 126.15, maxLng: 126.97 },
};

const SIGUNGU_RADIUS_M = 20_000;
const SIDO_FALLBACK_RADIUS_M = 55_000;

function isInsideBounds(coordinate: GeoCoordinate, bounds: MapBounds): boolean {
  return (
    coordinate.latitude >= bounds.minLat &&
    coordinate.latitude <= bounds.maxLat &&
    coordinate.longitude >= bounds.minLng &&
    coordinate.longitude <= bounds.maxLng
  );
}

/** 주소 없이 좌표만 있는 시설의 지역 필터 (AED 등) */
export function isCoordinateInFacilityRegion(
  coordinate: GeoCoordinate,
  filter: { stage1: string; stage2?: string },
  regionCenter?: GeoCoordinate,
): boolean {
  if (!filter?.stage1?.trim()) return true;
  if (!isValidCoordinate(coordinate)) return false;

  const stage1 = canonicalizeStage1(filter.stage1);
  const stage2 = filter.stage2?.trim() ?? '';

  if (stage2 && regionCenter && isValidCoordinate(regionCenter)) {
    return calculateDistanceMeters(coordinate, regionCenter) <= SIGUNGU_RADIUS_M;
  }

  const bounds = SIDO_COORDINATE_BOUNDS[stage1];
  if (bounds) {
    return isInsideBounds(coordinate, bounds);
  }

  if (regionCenter && isValidCoordinate(regionCenter)) {
    return calculateDistanceMeters(coordinate, regionCenter) <= SIDO_FALLBACK_RADIUS_M;
  }

  return true;
}

export function filterCoordinatesByFacilityRegion<T extends GeoCoordinate>(
  items: T[],
  filter: { stage1: string; stage2?: string } | undefined,
  regionCenter: GeoCoordinate,
): T[] {
  if (!filter?.stage1) return items;

  const stage1 = canonicalizeStage1(filter.stage1);
  const stage2 = filter.stage2?.trim() ?? '';
  const bounds = !stage2 ? SIDO_COORDINATE_BOUNDS[stage1] : undefined;

  return items.filter((item) => {
    if (!isValidCoordinate(item)) return false;

    if (stage2 && isValidCoordinate(regionCenter)) {
      return calculateDistanceMeters(item, regionCenter) <= SIGUNGU_RADIUS_M;
    }

    if (bounds) {
      return isInsideBounds(item, bounds);
    }

    if (isValidCoordinate(regionCenter)) {
      return calculateDistanceMeters(item, regionCenter) <= SIDO_FALLBACK_RADIUS_M;
    }

    return true;
  });
}
