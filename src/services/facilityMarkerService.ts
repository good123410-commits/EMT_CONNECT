import type { FacilitySearchParams } from '@/hooks/useFacilitySearchMode';
import { searchLocalAeds } from '@/services/localAedStore';
import { searchLocalHospitals } from '@/services/localFacilityStore';
import type { UnifiedFacilitySearchOptions } from '@/services/facilitySearchService';
import { buildLocalSearchOptions } from '@/services/facilitySearchService';
import { searchLocalPharmacyMarkers } from '@/services/hybridPharmacyService';
import type { LocalAedMarker } from '@/types/localAed';
import type { LocalHospitalMarker, LocalPharmacyMarker } from '@/types/localFacility';

export type FacilityMarkerKind = 'aed' | 'hospital' | 'pharmacy';

export type FacilityMarkerResult =
  | { kind: 'aed'; items: LocalAedMarker[] }
  | { kind: 'hospital'; items: LocalHospitalMarker[] }
  | { kind: 'pharmacy'; items: LocalPharmacyMarker[] };

/** 탭 최초 진입 — 좁은 반경으로 빠르게 표시 */
export const FACILITY_INITIAL_RADIUS: Record<FacilityMarkerKind, number> = {
  aed: 1_000,
  hospital: 3_000,
  pharmacy: 5_000,
};

export const FACILITY_INITIAL_LIMIT: Record<FacilityMarkerKind, number> = {
  aed: 40,
  hospital: 50,
  pharmacy: 60,
};

const DEFAULT_OPTIONS: Record<FacilityMarkerKind, UnifiedFacilitySearchOptions> = {
  aed: { limit: 80, radiusMeters: 5_000 },
  hospital: { limit: 100, radiusMeters: 20_000, erOnly: false },
  pharmacy: { limit: 120, radiusMeters: 25_000 },
};

export function buildFacilityMarkerQueryKey(
  kind: FacilityMarkerKind,
  params: FacilitySearchParams,
  options?: UnifiedFacilitySearchOptions,
  phase: 'initial' | 'expanded' = 'expanded',
) {
  const merged = { ...DEFAULT_OPTIONS[kind], ...options };
  return [
    'facility-markers',
    kind,
    phase,
    params.mode,
    params.textQuery,
    params.regionFilter?.stage1 ?? '',
    params.regionFilter?.stage2 ?? '',
    Number(params.coordinate.latitude.toFixed(4)),
    Number(params.coordinate.longitude.toFixed(4)),
    merged.limit,
    merged.radiusMeters,
    merged.erOnly ?? false,
  ] as const;
}

export function searchFacilityMarkers(
  kind: FacilityMarkerKind,
  params: FacilitySearchParams,
  optionOverrides?: UnifiedFacilitySearchOptions,
): FacilityMarkerResult['items'] {
  try {
    const defaults = DEFAULT_OPTIONS[kind];
    const localOptions = buildLocalSearchOptions(params, { ...defaults, ...optionOverrides });
    const { textQuery, coordinate } = params;

    if (kind === 'aed') {
      return searchLocalAeds(textQuery, coordinate, localOptions);
    }
    if (kind === 'hospital') {
      return searchLocalHospitals(textQuery, coordinate, localOptions);
    }
    return searchLocalPharmacyMarkers(textQuery, coordinate, localOptions);
  } catch (error) {
    if (__DEV__) {
      console.warn('[facility-markers] search failed', { kind, error });
    }
    return [];
  }
}

export function getFacilitySearchOptions(
  kind: FacilityMarkerKind,
  phase: 'initial' | 'expanded',
  overrides?: UnifiedFacilitySearchOptions,
): UnifiedFacilitySearchOptions {
  if (phase === 'initial') {
    return {
      limit: FACILITY_INITIAL_LIMIT[kind],
      radiusMeters: FACILITY_INITIAL_RADIUS[kind],
      ...overrides,
    };
  }

  return {
    ...DEFAULT_OPTIONS[kind],
    ...overrides,
  };
}
