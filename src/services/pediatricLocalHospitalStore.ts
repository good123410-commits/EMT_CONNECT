import rawMoonlightHospitals from '../../assets/data/generated/moonlight_hospitals_perfect.json';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
  normalizeEmergencyApiRegion,
} from '@/services/emergencyApi';
import type { HospitalFinderItem } from '@/services/hospitalFinderService';
import { sortPediatricHospitals } from '@/services/hospitalFinderService';
import { getMergedBundledHospitalRecords } from '@/services/customHospitalService';
import { buildFacilityMatchKey, normalizeFacilityName } from '@/services/localFacilityStore';
import type { GeoCoordinate, LocationRegion } from '@/services/locationService';
import {
  matchesFacilityAddressRegion,
} from '@/utils/facilityAddressRegion';
import {
  MOONLIGHT_DAY_ORDER,
  type MoonlightHospitalRecord,
  type MoonlightOperatingHours,
} from '@/types/moonlightHospital';
import type { HospitalDutyDay } from '@/utils/hospitalHours';
import {
  DUTY_DAY_LABELS,
  resolveHospitalOpenStatus,
} from '@/utils/hospitalHours';

const SOURCE = rawMoonlightHospitals as MoonlightHospitalRecord[];

function cleanHospitalName(name: string): string {
  return name.replace(/\s*진료중\s*$/u, '').trim();
}

const DAY_LABEL_TO_CODE: Record<string, number> = {
  월요일: 1,
  화요일: 2,
  수요일: 3,
  목요일: 4,
  금요일: 5,
  토요일: 6,
  일요일: 7,
  공휴일: 8,
};

function matchesPediatricLocalRegion(
  address: string,
  filter?: { stage1: string; stage2?: string },
): boolean {
  if (!filter?.stage1?.trim()) return true;

  const normalized = normalizeEmergencyApiRegion({
    stage1: filter.stage1,
    stage2: filter.stage2 ?? '',
    label: filter.stage2 ? `${filter.stage1} ${filter.stage2}` : filter.stage1,
  });

  return matchesFacilityAddressRegion(address, '', {
    stage1: normalized.stage1,
    stage2: normalized.stage2,
  });
}

function moonlightHoursToWeeklySchedule(hours: MoonlightOperatingHours): HospitalDutyDay[] {
  return MOONLIGHT_DAY_ORDER.map((dayLabel) => {
    const dayCode = DAY_LABEL_TO_CODE[dayLabel] ?? 0;
    const raw = hours[dayLabel]?.trim() ?? '';

    if (!raw || raw.includes('휴무')) {
      return {
        dayCode,
        dayLabel: DUTY_DAY_LABELS[dayCode] ?? dayLabel,
        start: '',
        end: '',
        closed: true,
      };
    }

    const timeMatch = raw.match(/(\d{1,2}:\d{2})\s*[~\-]\s*(\d{1,2}:\d{2})/);
    if (timeMatch) {
      return {
        dayCode,
        dayLabel: DUTY_DAY_LABELS[dayCode] ?? dayLabel,
        start: timeMatch[1],
        end: timeMatch[2],
        closed: false,
      };
    }

    return {
      dayCode,
      dayLabel: DUTY_DAY_LABELS[dayCode] ?? dayLabel,
      start: raw,
      end: '',
      closed: false,
    };
  }).filter((day) => day.dayCode > 0);
}

function buildCoordinateLookup(): Map<string, GeoCoordinate> {
  const lookup = new Map<string, GeoCoordinate>();

  for (const record of getMergedBundledHospitalRecords()) {
    if (!record.lat || !record.lng) continue;
    const coord = { latitude: record.lat, longitude: record.lng };
    lookup.set(normalizeFacilityName(record.a), coord);
    lookup.set(normalizeFacilityName(record.n), coord);
    lookup.set(buildFacilityMatchKey(record.n, record.a), coord);
  }

  return lookup;
}

const COORDINATE_LOOKUP = buildCoordinateLookup();

function resolveCoordinates(name: string, address: string): GeoCoordinate {
  const keys = [
    normalizeFacilityName(address),
    normalizeFacilityName(name),
    buildFacilityMatchKey(name, address),
  ];

  for (const key of keys) {
    const coord = COORDINATE_LOOKUP.get(key);
    if (coord) return coord;
  }

  for (const [key, coord] of COORDINATE_LOOKUP.entries()) {
    const normalizedAddress = normalizeFacilityName(address);
    if (normalizedAddress.length >= 8 && key.includes(normalizedAddress.slice(0, 12))) {
      return coord;
    }
  }

  return { latitude: 0, longitude: 0 };
}

function toPediatricLocalHospital(record: MoonlightHospitalRecord, index: number): HospitalFinderItem {
  const displayName = cleanHospitalName(record.name);
  const address = record.address.trim();
  const operatingHours = record.operating_hours ?? {};
  const weeklySchedule = moonlightHoursToWeeklySchedule(operatingHours);
  const openStatus = resolveHospitalOpenStatus(weeklySchedule);
  const coordinates = resolveCoordinates(displayName, address);

  return {
    hpid: `local-moonlight-${index}-${buildFacilityMatchKey(displayName, address)}`,
    name: displayName,
    address,
    phone: record.phone.trim() || '-',
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    distanceM: 0,
    distanceKm: 0,
    walkMin: 0,
    facilityType: '달빛어린이병원',
    specialties: ['소아청소년과', '달빛어린이'],
    weeklySchedule,
    isMoonlightHospital: true,
    isPediatricCenter: true,
    isOpenNow: openStatus.isOpenNow,
    openStatusLabel: weeklySchedule.some((day) => !day.closed && day.start)
      ? openStatus.label
      : '참고 정보',
    localOperatingHours: operatingHours,
    isLocalBundled: true,
  };
}

const ALL_LOCAL_PEDIATRIC_HOSPITALS: HospitalFinderItem[] = SOURCE.map(toPediatricLocalHospital);

export function getAllPediatricLocalHospitals(): HospitalFinderItem[] {
  return ALL_LOCAL_PEDIATRIC_HOSPITALS;
}

function withDistance(
  items: HospitalFinderItem[],
  coordinate: GeoCoordinate,
): HospitalFinderItem[] {
  return items.map((item) => {
    if (!item.latitude || !item.longitude) return item;
    const distanceM = calculateDistanceMeters(coordinate, {
      latitude: item.latitude,
      longitude: item.longitude,
    });
    return {
      ...item,
      distanceM,
      distanceKm: Math.round((distanceM / 1000) * 10) / 10,
      walkMin: estimateWalkMinutes(distanceM),
    };
  });
}

export function filterPediatricLocalHospitals(
  items: HospitalFinderItem[],
  options: {
    regionFilter?: { stage1: string; stage2?: string };
    coordinate: GeoCoordinate;
    radiusMeters?: number;
  },
): HospitalFinderItem[] {
  const { regionFilter, coordinate, radiusMeters = 80_000 } = options;

  let filtered = items;
  if (regionFilter?.stage1) {
    filtered = items.filter((item) => matchesPediatricLocalRegion(item.address, regionFilter));
  } else {
    filtered = withDistance(items, coordinate).filter((item) => {
      if (!item.latitude || !item.longitude) return true;
      return item.distanceM <= radiusMeters;
    });
  }

  return withDistance(filtered, coordinate);
}

export function mergePediatricHospitalResults(
  localItems: HospitalFinderItem[],
  apiItems: HospitalFinderItem[],
): HospitalFinderItem[] {
  const map = new Map<string, HospitalFinderItem>();

  for (const item of localItems) {
    const key = item.hpid || buildFacilityMatchKey(item.name, item.address);
    map.set(key, item);
  }

  for (const item of apiItems) {
    const key = item.hpid || buildFacilityMatchKey(item.name, item.address);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      continue;
    }

    const keepLocalHours = Boolean(existing.localOperatingHours);
    map.set(key, {
      ...item,
      ...existing,
      hpid: existing.hpid,
      name: existing.name,
      address: existing.address,
      phone: existing.phone !== '-' ? existing.phone : item.phone,
      latitude: item.latitude || existing.latitude,
      longitude: item.longitude || existing.longitude,
      weeklySchedule: keepLocalHours
        ? existing.weeklySchedule
        : item.weeklySchedule.length
          ? item.weeklySchedule
          : existing.weeklySchedule,
      localOperatingHours: existing.localOperatingHours,
      isLocalBundled: existing.isLocalBundled,
      isMoonlightHospital: existing.isMoonlightHospital || item.isMoonlightHospital,
      isPediatricCenter: existing.isPediatricCenter || item.isPediatricCenter,
      isOpenNow: keepLocalHours ? existing.isOpenNow : item.isOpenNow || existing.isOpenNow,
      openStatusLabel: keepLocalHours ? existing.openStatusLabel : item.openStatusLabel,
      specialties: [...new Set([...existing.specialties, ...item.specialties])],
    });
  }

  return [...map.values()];
}

export function loadPediatricLocalHospitalsForSearch(options: {
  coordinate: GeoCoordinate;
  regionFilter?: { stage1: string; stage2?: string };
  mode: 'gps' | 'manual';
}): HospitalFinderItem[] {
  const filtered = filterPediatricLocalHospitals(getAllPediatricLocalHospitals(), {
    regionFilter: options.regionFilter,
    coordinate: options.coordinate,
  });

  return options.mode === 'gps'
    ? [...filtered].sort((a, b) => a.distanceM - b.distanceM)
    : sortPediatricHospitals(filtered);
}

export function buildPediatricLocalRegion(
  regionFilter?: { stage1: string; stage2?: string },
): LocationRegion {
  if (!regionFilter?.stage1) {
    return normalizeEmergencyApiRegion({ stage1: '서울특별시', stage2: '', label: '서울특별시' });
  }

  const stage2 = regionFilter.stage2?.trim() ?? '';
  return normalizeEmergencyApiRegion({
    stage1: regionFilter.stage1,
    stage2,
    label: stage2 ? `${regionFilter.stage1} ${stage2}` : regionFilter.stage1,
  });
}
