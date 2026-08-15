import type { LocalPharmacyMarker } from '@/types/localFacility';
import { getPharmacyOpenStatus, isTodayNightPharmacy } from '@/utils/pharmacyHours';

export type PharmacyListViewMode = 'distance' | 'night-priority';

/** 심야약국 우선 보기: 금일 심야 → 영업 중 → 거리순 */
export function sortPharmaciesForListView(
  markers: LocalPharmacyMarker[],
  viewMode: PharmacyListViewMode,
  now = new Date(),
): LocalPharmacyMarker[] {
  if (viewMode === 'distance' || markers.length === 0) return markers;

  return [...markers].sort((a, b) => {
    const aNight = isTodayNightPharmacy(a, now);
    const bNight = isTodayNightPharmacy(b, now);
    if (aNight !== bNight) return aNight ? -1 : 1;

    const aOpen = getPharmacyOpenStatus(a, now).isOpenNow;
    const bOpen = getPharmacyOpenStatus(b, now).isOpenNow;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;

    return (a.distanceM ?? 0) - (b.distanceM ?? 0);
  });
}

export function getPharmacyEmphasisMarkerIds(
  markers: LocalPharmacyMarker[],
  now = new Date(),
): Set<string> {
  const ids = new Set<string>();
  for (const marker of markers) {
    const isNight = isTodayNightPharmacy(marker, now);
    const isOpen = getPharmacyOpenStatus(marker, now).isOpenNow;
    if (isNight || isOpen) {
      ids.add(marker.i);
    }
  }
  return ids;
}

export function getPharmacyListCardVariant(
  marker: LocalPharmacyMarker,
  viewMode: PharmacyListViewMode,
  now = new Date(),
): 'default' | 'pharmacy-night' | 'pharmacy-open' {
  if (viewMode !== 'night-priority') return 'default';

  const isNight = isTodayNightPharmacy(marker, now);
  const isOpen = getPharmacyOpenStatus(marker, now).isOpenNow;

  if (isNight) return 'pharmacy-night';
  if (isOpen) return 'pharmacy-open';
  return 'default';
}
