const EARTH_RADIUS_M = 6378137;

/** EPSG:3857(Web Mercator) → WGS84 */
export function webMercatorToWgs84(x: number, y: number): {
  latitude: number;
  longitude: number;
} {
  const longitude = (x / EARTH_RADIUS_M) * (180 / Math.PI);
  const latitude = (Math.atan(Math.exp(y / EARTH_RADIUS_M)) * 360) / Math.PI - 90;
  return { latitude, longitude };
}

export function isValidWebMercatorCoordinate(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 20_037_508 && Math.abs(y) <= 20_037_508;
}
