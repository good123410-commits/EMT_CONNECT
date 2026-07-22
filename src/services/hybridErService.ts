import type { ErStatus } from '@/mockData/aedAndEmergency';
import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { toLocationRegion } from '@/services/facilityRegionFilter';
import {
  buildFacilityMatchKey,
  findLocalHospitalById,
  normalizeFacilityName,
  searchLocalHospitals,
} from '@/services/localFacilityStore';
import {
  fetchAllEmergencyBedInfo,
  fetchHospitalDetail,
  isMoonlightChildrenHospital,
  normalizeEmergencyApiRegion,
  safeErStatus,
  summarizeEmergencyBedItems,
  type ErDashboardStats,
  type HospitalDetail,
  type HospitalMarkerShell,
} from '@/services/emergencyApi';
import type { HospitalMetadataEntry } from '@/services/hospitalFinderService';
import type { GeoCoordinate, LocationRegion, LocationSnapshot } from '@/services/locationService';
import type { LocalHospitalMarker } from '@/types/localFacility';
import { LIVE_STATUS_FALLBACK_MESSAGE } from '@/types/localFacility';
import type { HospitalDutyDay } from '@/utils/hospitalHours';
import {
  buildEmergencyHospitalSpecs,
  type EmergencyHospitalSpecs,
} from '@/utils/emergencyHospitalSpecs';
import { withResilientFallback } from '@/utils/resilientAsync';

export type ErLiveSnapshot = {
  availableErBeds: number;
  availablePediatricErBeds: number;
  status: ErStatus;
  updatedAt: string;
  hpid: string;
  hospitalName: string;
  specs: EmergencyHospitalSpecs;
};

export type ErLiveOverlayResult = {
  success: boolean;
  region: LocationRegion;
  snapshots: ErLiveSnapshot[];
  byMatchKey: Map<string, ErLiveSnapshot>;
  byNameKey: Map<string, ErLiveSnapshot>;
  byHpid: Map<string, ErLiveSnapshot>;
  stats: ErDashboardStats;
  errorMessage?: string;
};

/** 지도 검색 모드에 맞는 E-Gen API 지역 파라미터 결정 */
export function resolveErLiveApiRegion(
  searchParams: FacilitySearchParams,
  locationSnapshot: LocationSnapshot,
): LocationRegion {
  if (searchParams.mode === 'manual' && searchParams.regionFilter?.stage1) {
    return normalizeEmergencyApiRegion(toLocationRegion(searchParams.regionFilter));
  }
  return normalizeEmergencyApiRegion(locationSnapshot.region);
}

const EMPTY_STATS: ErDashboardStats = {
  totalHospitals: 0,
  totalAvailableBeds: 0,
  availableCount: 0,
  congestedCount: 0,
  fullCount: 0,
  pediatricCount: 0,
};

export type HybridHospitalMarker = HospitalMarkerShell & {
  address: string;
  phone: string;
  facilityType: string;
  isErCapable: boolean;
  liveSynced: boolean;
  liveFailed: boolean;
  liveMessage?: string;
};

export type LocalHospitalMarkerWithLive = LocalHospitalMarker & {
  availableErBeds: number;
  availablePediatricErBeds: number;
  status: ErStatus;
  isPediatricPriority: boolean;
  isErPriority: boolean;
  liveSynced: boolean;
  liveFailed: boolean;
  liveMessage?: string;
  specs: EmergencyHospitalSpecs | null;
  specialties: string[];
  weeklySchedule: HospitalDutyDay[];
  isOpenNow: boolean;
  openStatusLabel: string;
};

const DEFAULT_LIVE_FIELDS = {
  availableErBeds: 0,
  availablePediatricErBeds: 0,
  status: 'congested' as ErStatus,
  isPediatricPriority: false,
  isErPriority: false,
  liveSynced: false,
  liveFailed: false,
  specs: null as EmergencyHospitalSpecs | null,
  specialties: [] as string[],
  weeklySchedule: [] as HospitalDutyDay[],
  isOpenNow: false,
  openStatusLabel: '확인 필요',
};

function indexLiveSnapshots(items: ErLiveSnapshot[]) {
  const byMatchKey = new Map<string, ErLiveSnapshot>();
  const byNameKey = new Map<string, ErLiveSnapshot>();
  const byHpid = new Map<string, ErLiveSnapshot>();

  for (const item of items) {
    const nameKey = normalizeFacilityName(item.hospitalName);
    if (!byNameKey.has(nameKey)) {
      byNameKey.set(nameKey, item);
    }

    const matchKey = buildFacilityMatchKey(item.hospitalName);
    if (!byMatchKey.has(matchKey)) {
      byMatchKey.set(matchKey, item);
    }

    if (item.hpid && !byHpid.has(item.hpid)) {
      byHpid.set(item.hpid, item);
    }
  }

  return { byMatchKey, byNameKey, byHpid };
}

export async function fetchErLiveOverlay(region: LocationRegion): Promise<ErLiveOverlayResult> {
  const normalizedRegion = normalizeEmergencyApiRegion(region);

  if (__DEV__) {
    console.log('[ER Live] fetchErLiveOverlay region', normalizedRegion);
  }

  const result = await withResilientFallback(
    async () => {
      const items = await fetchAllEmergencyBedInfo(normalizedRegion);

      const snapshots: ErLiveSnapshot[] = items.map((item) => ({
        hpid: item.hpid,
        hospitalName: item.hospitalName,
        availableErBeds: item.availableErBeds,
        availablePediatricErBeds: item.availablePediatricErBeds,
        status: safeErStatus(item.status),
        updatedAt: item.updatedAt,
        specs: buildEmergencyHospitalSpecs(item),
      }));

      const { byMatchKey, byNameKey, byHpid } = indexLiveSnapshots(snapshots);
      const stats = summarizeEmergencyBedItems(items);

      if (__DEV__) {
        console.log('[ER Live] overlay success', {
          region: normalizedRegion.label,
          hospitalCount: stats.totalHospitals,
          totalBeds: stats.totalAvailableBeds,
        });
      }

      return {
        success: true as const,
        region: normalizedRegion,
        snapshots,
        byMatchKey,
        byNameKey,
        byHpid,
        stats,
      };
    },
    () => ({
      success: false as const,
      region: normalizedRegion,
      snapshots: [] as ErLiveSnapshot[],
      byMatchKey: new Map<string, ErLiveSnapshot>(),
      byNameKey: new Map<string, ErLiveSnapshot>(),
      byHpid: new Map<string, ErLiveSnapshot>(),
      stats: EMPTY_STATS,
      errorMessage: LIVE_STATUS_FALLBACK_MESSAGE,
    }),
    { label: 'fetchErLiveOverlay' },
  );

  if (!result.data.success && result.source === 'fallback') {
    if (__DEV__) {
      console.warn('[ER Live] overlay failed', {
        region: normalizedRegion.label,
        errorMessage: result.error,
      });
    }
  }

  return result.data;
}

function resolveLiveSnapshot(
  marker: Pick<HybridHospitalMarker, 'name' | 'hpid'>,
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

export function applyErLiveOverlay(
  markers: HybridHospitalMarker[],
  overlay: ErLiveOverlayResult | null,
): HybridHospitalMarker[] {
  if (!overlay) return markers;

  if (!overlay.success) {
    return markers.map((marker) => ({
      ...marker,
      liveSynced: false,
      liveFailed: true,
      liveMessage: LIVE_STATUS_FALLBACK_MESSAGE,
    }));
  }

  return markers.map((marker) => {
    const live = resolveLiveSnapshot(marker, overlay);
    if (!live) {
      return {
        ...marker,
        liveSynced: false,
        liveFailed: false,
      };
    }

    return {
      ...marker,
      availableErBeds: live.availableErBeds,
      availablePediatricErBeds: live.availablePediatricErBeds,
      status: live.status,
      isPediatricPriority:
        marker.isPediatricPriority ||
        live.availablePediatricErBeds > 0 ||
        isMoonlightChildrenHospital(marker.name),
      liveSynced: true,
      liveFailed: false,
    };
  });
}

export function applyErLiveOverlayToLocal(
  markers: LocalHospitalMarker[],
  overlay: ErLiveOverlayResult | null,
): LocalHospitalMarkerWithLive[] {
  if (!overlay) {
    return markers.map((marker) => ({
      ...marker,
      ...DEFAULT_LIVE_FIELDS,
      isErPriority: marker.er === 1,
      specialties: marker.specialties ?? DEFAULT_LIVE_FIELDS.specialties,
      weeklySchedule: marker.weeklySchedule ?? DEFAULT_LIVE_FIELDS.weeklySchedule,
      isOpenNow: marker.isOpenNow ?? DEFAULT_LIVE_FIELDS.isOpenNow,
      openStatusLabel: marker.openStatusLabel ?? DEFAULT_LIVE_FIELDS.openStatusLabel,
    }));
  }

  if (!overlay.success) {
    return markers.map((marker) => ({
      ...marker,
      ...DEFAULT_LIVE_FIELDS,
      isErPriority: marker.er === 1,
      liveFailed: true,
      liveMessage: LIVE_STATUS_FALLBACK_MESSAGE,
      specialties: marker.specialties ?? DEFAULT_LIVE_FIELDS.specialties,
      weeklySchedule: marker.weeklySchedule ?? DEFAULT_LIVE_FIELDS.weeklySchedule,
      isOpenNow: marker.isOpenNow ?? DEFAULT_LIVE_FIELDS.isOpenNow,
      openStatusLabel: marker.openStatusLabel ?? DEFAULT_LIVE_FIELDS.openStatusLabel,
    }));
  }

  return markers.map((marker) => {
    const live = resolveLiveSnapshot({ name: marker.n, hpid: marker.i }, overlay);
    if (!live) {
      return {
        ...marker,
        ...DEFAULT_LIVE_FIELDS,
        isErPriority: marker.er === 1,
        specialties: marker.specialties ?? DEFAULT_LIVE_FIELDS.specialties,
        weeklySchedule: marker.weeklySchedule ?? DEFAULT_LIVE_FIELDS.weeklySchedule,
        isOpenNow: marker.isOpenNow ?? DEFAULT_LIVE_FIELDS.isOpenNow,
        openStatusLabel: marker.openStatusLabel ?? DEFAULT_LIVE_FIELDS.openStatusLabel,
      };
    }

    return {
      ...marker,
      availableErBeds: live.availableErBeds,
      availablePediatricErBeds: live.availablePediatricErBeds,
      status: live.status,
      isPediatricPriority: live.availablePediatricErBeds > 0 || isMoonlightChildrenHospital(marker.n),
      isErPriority: marker.er === 1 || Boolean(live),
      liveSynced: true,
      liveFailed: false,
      specs: live.specs,
      specialties: marker.specialties ?? DEFAULT_LIVE_FIELDS.specialties,
      weeklySchedule: marker.weeklySchedule ?? DEFAULT_LIVE_FIELDS.weeklySchedule,
      isOpenNow: marker.isOpenNow ?? DEFAULT_LIVE_FIELDS.isOpenNow,
      openStatusLabel: marker.openStatusLabel ?? DEFAULT_LIVE_FIELDS.openStatusLabel,
      isPartner: marker.isPartner,
      customMemo: marker.customMemo,
      hospitalType: marker.hospitalType,
      isCustomOnly: marker.isCustomOnly,
    };
  });
}

function resolveMetadataEntry(
  marker: Pick<LocalHospitalMarker, 'i' | 'n' | 'a' | 'sg'>,
  metadataIndex: Map<string, HospitalMetadataEntry>,
): HospitalMetadataEntry | undefined {
  if (marker.i) {
    const byHpid = metadataIndex.get(`hpid:${marker.i}`);
    if (byHpid) return byHpid;
  }

  const byKey = metadataIndex.get(`key:${buildFacilityMatchKey(marker.n, marker.sg || marker.a)}`);
  if (byKey) return byKey;

  return metadataIndex.get(`name:${normalizeFacilityName(marker.n)}`);
}

/** 병·의원 찾기 API 메타데이터를 응급실 탭 마커에 병합 */
export function enrichErMarkersWithMetadata(
  markers: LocalHospitalMarkerWithLive[],
  metadataIndex: Map<string, HospitalMetadataEntry> | null,
): LocalHospitalMarkerWithLive[] {
  if (!metadataIndex || metadataIndex.size === 0) return markers;

  return markers.map((marker) => {
    const meta = resolveMetadataEntry(marker, metadataIndex);
    if (!meta) return marker;

    return {
      ...marker,
      specialties: meta.specialties.length ? meta.specialties : marker.specialties,
      weeklySchedule: meta.weeklySchedule.some((day) => !day.closed)
        ? meta.weeklySchedule
        : marker.weeklySchedule,
      isOpenNow: meta.isOpenNow || marker.isOpenNow,
      openStatusLabel:
        marker.openStatusLabel && marker.openStatusLabel !== '확인 필요'
          ? marker.openStatusLabel
          : meta.openStatusLabel,
    };
  });
}

function getErTabSortTier(marker: LocalHospitalMarkerWithLive): number {
  if (marker.isErPriority) return 0;
  if (isMoonlightChildrenHospital(marker.n)) return 1;
  if (marker.isPediatricPriority) return 2;
  return 3;
}

/** 응급실 보유·실시간 매칭 병원을 최상단에 고정 */
export function sortErTabHospitals(
  markers: LocalHospitalMarkerWithLive[],
): LocalHospitalMarkerWithLive[] {
  return [...markers].sort((a, b) => {
    const tierDiff = getErTabSortTier(a) - getErTabSortTier(b);
    if (tierDiff !== 0) return tierDiff;
    return a.distanceM - b.distanceM;
  });
}

export function searchLocalHospitalMarkers(
  query: string,
  coordinate: GeoCoordinate,
  options?: import('@/types/localFacility').LocalSearchOptions,
): LocalHospitalMarker[] {
  return searchLocalHospitals(query, coordinate, options);
}

export function buildHybridHospitalDetail(
  marker: HybridHospitalMarker,
  overlay: ErLiveOverlayResult | null,
): HospitalDetail {
  const live = overlay?.success ? resolveLiveSnapshot(marker, overlay) : undefined;
  const liveFailed = overlay !== null && !overlay.success;
  const liveMessage = liveFailed ? LIVE_STATUS_FALLBACK_MESSAGE : undefined;

  return {
    rnum: 0,
    phpid: '',
    hpid: marker.hpid,
    hospitalName: marker.name,
    erPhone: marker.phone || '-',
    updatedAt: live?.updatedAt ?? new Date().toISOString(),
    availableErBeds: live?.availableErBeds ?? marker.availableErBeds,
    availablePediatricErBeds:
      live?.availablePediatricErBeds ?? marker.availablePediatricErBeds,
    availableSurgeryBeds: 0,
    availableNeuroIcuBeds: 0,
    availableNeonatalIcuBeds: live?.availablePediatricErBeds ?? 0,
    availableChestIcuBeds: 0,
    availableGeneralIcuBeds: 0,
    availableInpatientBeds: 0,
    onCallDoctor: '응급의학과',
    ctAvailable: true,
    mriAvailable: true,
    angioAvailable: true,
    ventilatorAvailable: true,
    ambulanceAvailable: true,
    erDoctorPhone: marker.phone || '-',
    pediatricDoctorPhone: marker.phone || '-',
    icuInternalMedicineBeds: 0,
    icuSurgeryBeds: 0,
    icuOrthopedicBeds: 0,
    icuNeurologyBeds: 0,
    icuNeurosurgeryBeds: 0,
    icuToxicologyBeds: 0,
    icuBurnBeds: 0,
    icuTraumaBeds: 0,
    pediatricVentilatorAvailable: false,
    incubatorAvailable: false,
    status: live?.status ?? marker.status,
    address: marker.address,
    phone: marker.phone || '-',
    latitude: marker.latitude,
    longitude: marker.longitude,
    emergencyClass: '01',
    emergencyClassName: marker.facilityType || '응급의학과',
    distanceM: marker.distanceM,
    distanceKm: marker.distanceKm,
    walkMin: marker.walkMin,
    isMoonlightHospital: isMoonlightChildrenHospital(marker.name),
    isPediatricPriority: marker.isPediatricPriority,
    description: liveMessage ?? `${marker.facilityType} · 로컬 기준 정보`,
    specialties: [],
    weeklySchedule: [],
    isOpenNow: false,
    openStatusLabel: '확인 필요',
  };
}

export async function fetchErHospitalFullDetail(
  hpid: string,
  options: {
    coordinate: GeoCoordinate;
    region: LocationRegion;
  },
): Promise<HospitalDetail | null> {
  try {
    return await fetchHospitalDetail(hpid, {
      coordinate: options.coordinate,
      region: options.region,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[ER Hybrid] fetchErHospitalFullDetail failed', { hpid, error });
    }
    return null;
  }
}

export function getHybridHospitalDetailFromStore(
  hpid: string,
  coordinate: GeoCoordinate,
  overlay: ErLiveOverlayResult | null,
): HospitalDetail | null {
  const local = findLocalHospitalById(hpid);
  if (!local) return null;

  const [marker] = searchLocalHospitalMarkers(local.n, coordinate, { limit: 100 }).filter(
    (item) => item.i === hpid,
  );

  if (!marker) return null;

  const [withLive] = applyErLiveOverlayToLocal([marker], overlay);
  const detail = buildHybridHospitalDetail(
    {
      hpid: withLive.i,
      name: withLive.n,
      latitude: withLive.lat,
      longitude: withLive.lng,
      distanceM: withLive.distanceM,
      walkMin: withLive.walkMin,
      distanceKm: withLive.distanceKm,
      availableErBeds: withLive.availableErBeds,
      availablePediatricErBeds: withLive.availablePediatricErBeds,
      status: withLive.status,
      isPediatricPriority: withLive.isPediatricPriority,
      address: withLive.a,
      phone: withLive.p,
      facilityType: withLive.td,
      isErCapable: withLive.er === 1,
      liveSynced: withLive.liveSynced,
      liveFailed: withLive.liveFailed,
      liveMessage: withLive.liveMessage,
    },
    overlay,
  );

  return {
    ...detail,
    specialties: withLive.specialties.length ? withLive.specialties : detail.specialties,
    weeklySchedule: withLive.weeklySchedule.length ? withLive.weeklySchedule : detail.weeklySchedule,
    isOpenNow: withLive.openStatusLabel !== '확인 필요' ? withLive.isOpenNow : detail.isOpenNow,
    openStatusLabel:
      withLive.openStatusLabel !== '확인 필요' ? withLive.openStatusLabel : detail.openStatusLabel,
  };
}
