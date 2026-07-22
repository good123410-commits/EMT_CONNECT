import type { MapRegion } from '@/types/mapRegion';

export type { MapRegion };

export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export function regionToBounds(region: MapRegion, bufferRatio = 0): MapBounds {
  const latPad = (region.latitudeDelta / 2) * (1 + bufferRatio);
  const lngPad = (region.longitudeDelta / 2) * (1 + bufferRatio);

  return {
    minLat: region.latitude - latPad,
    maxLat: region.latitude + latPad,
    minLng: region.longitude - lngPad,
    maxLng: region.longitude + lngPad,
  };
}

export function regionToBBox(region: MapRegion, bufferRatio = 0): [number, number, number, number] {
  const bounds = regionToBounds(region, bufferRatio);
  return [bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat];
}

export function regionToZoom(region: MapRegion): number {
  const angle = Math.max(region.longitudeDelta, region.latitudeDelta, 0.0001);
  return Math.min(20, Math.max(0, Math.round(Math.log(360 / angle) / Math.LN2)));
}

export function isValidCoordinate(coordinate: MapCoordinate): boolean {
  if (!Number.isFinite(coordinate.latitude) || !Number.isFinite(coordinate.longitude)) {
    return false;
  }
  if (coordinate.latitude === 0 && coordinate.longitude === 0) {
    return false;
  }
  return true;
}

export function filterByMapBounds<T extends MapCoordinate>(
  items: T[],
  bounds: MapBounds,
): T[] {
  return items.filter(
    (item) =>
      isValidCoordinate(item) &&
      item.latitude >= bounds.minLat &&
      item.latitude <= bounds.maxLat &&
      item.longitude >= bounds.minLng &&
      item.longitude <= bounds.maxLng,
  );
}

export function coordinateToRegion(
  coordinate: MapCoordinate,
  delta = 0.025,
): MapRegion {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}
