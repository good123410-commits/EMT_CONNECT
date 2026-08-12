import {
  fetchErLiveOverlay,
  type ErLiveOverlayResult,
  type ErLiveSnapshot,
} from '@/services/hybridErService';
import {
  buildFacilityMatchKey,
  normalizeFacilityName,
} from '@/services/localFacilityStore';
import type { LocationRegion } from '@/services/locationService';
import { LIVE_STATUS_FALLBACK_MESSAGE } from '@/types/localFacility';

/** 실시간 병상 정보 TTL — 3분 */
export const ER_BED_CACHE_TTL_MS = 3 * 60 * 1000;

type TimedEntry<T> = {
  data: T;
  fetchedAt: number;
};

export type ErBedFetchResult = {
  snapshot: ErLiveSnapshot | null;
  fromCache: boolean;
  error?: string;
  overlaySuccess: boolean;
};

const regionCache = new Map<string, TimedEntry<ErLiveOverlayResult>>();
const hospitalCache = new Map<string, TimedEntry<ErBedFetchResult>>();
const regionInflight = new Map<string, Promise<ErLiveOverlayResult>>();

function regionCacheKey(region: LocationRegion): string {
  return `${region.stage1}|${region.stage2 ?? ''}`;
}

function hospitalCacheKey(hpid: string, region: LocationRegion): string {
  return `${hpid}|${regionCacheKey(region)}`;
}

function isFresh<T>(entry: TimedEntry<T>, ttlMs = ER_BED_CACHE_TTL_MS): boolean {
  return Date.now() - entry.fetchedAt < ttlMs;
}

function resolveLiveSnapshot(
  marker: { name: string; hpid: string },
  overlay: ErLiveOverlayResult,
): ErLiveSnapshot | undefined {
  if (marker.hpid && overlay.byHpid.has(marker.hpid)) {
    return overlay.byHpid.get(marker.hpid);
  }

  const matchKey = buildFacilityMatchKey(marker.name);
  const nameKey = normalizeFacilityName(marker.name);

  return (
    overlay.byMatchKey.get(matchKey) ??
    overlay.byNameKey.get(nameKey) ??
    overlay.snapshots.find((item) => {
      const apiName = normalizeFacilityName(item.hospitalName);
      return apiName.includes(nameKey) || nameKey.includes(apiName);
    })
  );
}

async function loadRegionOverlay(region: LocationRegion): Promise<ErLiveOverlayResult> {
  const key = regionCacheKey(region);
  const cached = regionCache.get(key);
  if (cached && isFresh(cached)) {
    return cached.data;
  }

  const inflight = regionInflight.get(key);
  if (inflight) {
    return inflight;
  }

  const request = fetchErLiveOverlay(region).finally(() => {
    regionInflight.delete(key);
  });

  regionInflight.set(key, request);
  const data = await request;
  regionCache.set(key, { data, fetchedAt: Date.now() });
  return data;
}

/** 병원 단위 실시간 병상 스냅샷 — 지역 캐시(TTL 3분) 재사용 */
export async function fetchErBedForHospital(params: {
  hpid: string;
  hospitalName: string;
  region: LocationRegion;
  force?: boolean;
}): Promise<ErBedFetchResult> {
  const { hpid, hospitalName, region, force = false } = params;
  if (!hpid?.trim()) {
    return {
      snapshot: null,
      fromCache: false,
      error: '병원 식별 정보가 없습니다.',
      overlaySuccess: false,
    };
  }

  const cacheKey = hospitalCacheKey(hpid, region);
  if (!force) {
    const cached = hospitalCache.get(cacheKey);
    if (cached && isFresh(cached)) {
      return cached.data;
    }
  }

  try {
    const overlay = await loadRegionOverlay(region);
    const snapshot = overlay.success
      ? resolveLiveSnapshot({ name: hospitalName, hpid }, overlay) ?? null
      : null;

    const result: ErBedFetchResult = {
      snapshot,
      fromCache: false,
      overlaySuccess: overlay.success,
      error: overlay.success
        ? snapshot
          ? undefined
          : '해당 병원의 실시간 병상 정보를 찾지 못했습니다.'
        : overlay.errorMessage ?? LIVE_STATUS_FALLBACK_MESSAGE,
    };

    hospitalCache.set(cacheKey, { data: result, fetchedAt: Date.now() });
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : LIVE_STATUS_FALLBACK_MESSAGE;
    const result: ErBedFetchResult = {
      snapshot: null,
      fromCache: false,
      error: message,
      overlaySuccess: false,
    };
    hospitalCache.set(cacheKey, { data: result, fetchedAt: Date.now() });
    return result;
  }
}

export function invalidateErBedCache(region?: LocationRegion): void {
  if (!region) {
    regionCache.clear();
    hospitalCache.clear();
    return;
  }

  const key = regionCacheKey(region);
  regionCache.delete(key);
  for (const hospitalKey of hospitalCache.keys()) {
    if (hospitalKey.endsWith(`|${key}`)) {
      hospitalCache.delete(hospitalKey);
    }
  }
}

export function peekErBedCache(params: {
  hpid: string;
  region: LocationRegion;
}): ErBedFetchResult | null {
  const entry = hospitalCache.get(hospitalCacheKey(params.hpid, params.region));
  if (!entry || !isFresh(entry)) return null;
  return entry.data;
}
