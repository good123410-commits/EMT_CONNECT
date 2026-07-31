import {
  KOREAN_PROVINCES,
  KOREAN_SIGUNGU_UNITS,
  type KoreanSigunguUnit,
} from '@/constants/koreanRegions';
import type { LocationRegion } from '@/services/locationService';
import { SIDO_LIST } from '@/services/locationService';

const unitByCode = new Map(KOREAN_SIGUNGU_UNITS.map((unit) => [unit.code, unit]));

export function getRegionUnitByCode(code: string | null | undefined): KoreanSigunguUnit | undefined {
  if (!code) return undefined;
  return unitByCode.get(code);
}

export function getSigunguUnitsForSido(sido: string): KoreanSigunguUnit[] {
  const province = KOREAN_PROVINCES.find((p) => p.name === sido);
  return province?.sigungu ?? [];
}

export function getSidoOptions(): readonly string[] {
  return SIDO_LIST;
}

/** GPS·지오코딩 결과를 시·군·구 코드로 매핑 */
export function resolveRegionCodeFromLocation(region: LocationRegion): string | null {
  if (!region.stage1) return null;

  const candidates = KOREAN_SIGUNGU_UNITS.filter((unit) => unit.sido === region.stage1);
  if (candidates.length === 0) return null;

  const stage2 = region.stage2?.trim() ?? '';
  if (!stage2) {
    return candidates[0]?.code ?? null;
  }

  const normalizedStage2 = stage2.replace(/\s+/g, '');

  const exact = candidates.find(
    (unit) =>
      unit.displayName === stage2 ||
      unit.sigungu === stage2 ||
      unit.sigungu === normalizedStage2 ||
      unit.displayName === normalizedStage2,
  );
  if (exact) return exact.code;

  const contains = candidates.find(
    (unit) =>
      unit.sigungu.includes(stage2) ||
      unit.sigungu.includes(normalizedStage2) ||
      stage2.includes(unit.displayName) ||
      normalizedStage2.includes(unit.displayName),
  );
  if (contains) return contains.code;

  const labelMatch = candidates.find((unit) => region.label.includes(unit.displayName));
  return labelMatch?.code ?? null;
}

export function formatRegionRouteParam(code: string): string {
  return encodeURIComponent(code);
}

export function parseRegionRouteParam(param: string): string | null {
  try {
    const decoded = decodeURIComponent(param).trim();
    return unitByCode.has(decoded) ? decoded : null;
  } catch {
    return null;
  }
}
