import sigunguBySido from '@/data/generated/sigungu_by_sido.json';
import { SIDO_LIST } from '@/services/locationService';

const SIGUNGU_BY_SIDO = sigunguBySido as Record<string, string[]>;

const sigunguCache = new Map<string, string[]>();

/** 시도별 시군구 목록 (정적 데이터만 사용 — 대용량 JSON 전체 스캔 방지) */
export function getSigunguOptionsForSido(sido: string): string[] {
  if (!sido) return [];

  const cached = sigunguCache.get(sido);
  if (cached) return cached;

  const list = [...(SIGUNGU_BY_SIDO[sido] ?? [])].sort((a, b) => a.localeCompare(b, 'ko'));
  sigunguCache.set(sido, list);
  return list;
}

export function getSidoOptions(): readonly string[] {
  return SIDO_LIST;
}
