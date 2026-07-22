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

const DEFAULT_OPTIONS: Record<FacilityMarkerKind, UnifiedFacilitySearchOptions> = {
  aed: { limit: 60, radiusMeters: 5_000 },
  hospital: { limit: 100, radiusMeters: 20_000, erOnly: false },
  pharmacy: { limit: 120, radiusMeters: 25_000 },
};

export function buildFacilityMarkerQueryKey(
  kind: FacilityMarkerKind,
  params: FacilitySearchParams,
  options?: UnifiedFacilitySearchOptions,
) {
  const merged = { ...DEFAULT_OPTIONS[kind], ...options };
  return [
    'facility-markers',
    kind,
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
}
