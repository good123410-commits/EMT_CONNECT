/** 지도에 한 번에 표시할 마커 상한 — 브라우저·네이티브 지도 부하 방지 */
export const MAX_MAP_DISPLAY_MARKERS = 500;

export function limitMapMarkers<T>(items: T[] | null | undefined, max = MAX_MAP_DISPLAY_MARKERS): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length <= max) return items;
  return items.slice(0, max);
}
