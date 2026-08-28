import type { GeoCoordinate } from '@/services/locationService';

/** Haversine 전 정밀 거리 계산 전 빠른 위·경도 박스 필터 */
export function filterByRoughRadius<T extends { latitude: number; longitude: number }>(
  items: readonly T[],
  coordinate: GeoCoordinate,
  radiusMeters: number,
): T[] {
  const latPad = radiusMeters / 111_000;
  const lngPad = radiusMeters / (111_000 * Math.cos((coordinate.latitude * Math.PI) / 180));

  return items.filter(
    (item) =>
      Math.abs(item.latitude - coordinate.latitude) <= latPad &&
      Math.abs(item.longitude - coordinate.longitude) <= lngPad,
  );
}

export async function deferToNextFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
