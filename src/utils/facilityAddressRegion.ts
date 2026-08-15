import { SIDO_LIST } from '@/services/locationService';
import { normalizeFacilityName } from '@/services/localFacilityStore';

export type ParsedFacilityRegion = {
  stage1: string;
  stage2: string;
};

/** 비표준 시도 접두 — 전라남도·광주 통합 표기 (데이터 변형 모두 수용) */
export const LEGACY_JEONNAM_GWANGJU_PREFIXES = [
  '전남광주통합특별시',
  '전남광주특별시',
] as const;

export const GWANGJU_METRO_DISTRICTS = ['동구', '서구', '남구', '북구', '광산구'] as const;

export const JEONNAM_SIGUNGU_NAMES = new Set([
  '목포시',
  '여수시',
  '순천시',
  '나주시',
  '광양시',
  '담양군',
  '곡성군',
  '구례군',
  '고흥군',
  '보성군',
  '화순군',
  '장흥군',
  '강진군',
  '해남군',
  '영암군',
  '무안군',
  '함평군',
  '영광군',
  '장성군',
  '완도군',
  '진도군',
  '신안군',
]);

const SIDO_ALIAS_MAP: Record<string, string> = {
  서울: '서울특별시',
  부산: '부산광역시',
  대구: '대구광역시',
  인천: '인천광역시',
  대전: '대전광역시',
  울산: '울산광역시',
  세종: '세종특별자치시',
  경기: '경기도',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북특별자치도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
};

const SIDO_SUFFIXES = ['특별자치도', '특별자치시', '특별시', '광역시', '자치시', '도'] as const;

/** 시·도 정규화 — 맥락 없이 "광주"만으로 광주광역시로 치환하지 않음 */
export function canonicalizeStage1(stage1: string): string {
  const trimmed = stage1.trim();
  if (!trimmed) return '';

  if (SIDO_LIST.includes(trimmed)) return trimmed;
  if (SIDO_SUFFIXES.some((suffix) => trimmed.endsWith(suffix))) return trimmed;

  for (const [alias, canonical] of Object.entries(SIDO_ALIAS_MAP)) {
    if (trimmed === alias || trimmed.startsWith(alias)) return canonical;
  }

  return trimmed;
}

function findLegacyPrefix(address: string): string | null {
  for (const prefix of LEGACY_JEONNAM_GWANGJU_PREFIXES) {
    if (address.includes(prefix)) return prefix;
  }
  return null;
}

/** 광주 5개 구 토큰(북구·광주북구 등)을 표준 구명으로 변환 */
export function resolveGwangjuMetroDistrict(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if ((GWANGJU_METRO_DISTRICTS as readonly string[]).includes(trimmed)) {
    return trimmed;
  }

  for (const district of GWANGJU_METRO_DISTRICTS) {
    if (trimmed === `광주${district}`) return district;
  }

  return null;
}

function parseLegacyJeollanamGwangjuAddress(address: string): ParsedFacilityRegion | null {
  const prefix = findLegacyPrefix(address);
  if (!prefix) return null;

  const remainder = address.slice(address.indexOf(prefix) + prefix.length).trim();
  const firstToken = remainder.split(/\s+/).filter(Boolean)[0] ?? '';

  const gwangjuDistrict = resolveGwangjuMetroDistrict(firstToken);
  if (gwangjuDistrict) {
    return { stage1: '광주광역시', stage2: gwangjuDistrict };
  }

  if (JEONNAM_SIGUNGU_NAMES.has(firstToken)) {
    return { stage1: '전라남도', stage2: firstToken };
  }

  return null;
}

function parseStandardKoreanAddress(address: string): ParsedFacilityRegion | null {
  const trimmed = address.trim();
  if (!trimmed) return null;

  if (/^경기도\s+광주시\b/.test(trimmed)) {
    return { stage1: '경기도', stage2: '광주시' };
  }

  const gwangjuMetroMatch = trimmed.match(/^광주광역시\s+([^\s,]+)/);
  if (gwangjuMetroMatch?.[1]) {
    const district = resolveGwangjuMetroDistrict(gwangjuMetroMatch[1]) ?? gwangjuMetroMatch[1];
    return { stage1: '광주광역시', stage2: district };
  }

  const standardMatch = trimmed.match(
    /^([가-힣]+(?:특별자치도|특별자치시|특별시|광역시|도))\s+([^\s,]+)/,
  );
  if (!standardMatch?.[1] || !standardMatch[2]) return null;

  const stage1 = canonicalizeStage1(standardMatch[1]);
  let stage2 = standardMatch[2].trim();

  if (stage1 === '광주광역시') {
    stage2 = resolveGwangjuMetroDistrict(stage2) ?? stage2;
  }

  return { stage1, stage2 };
}

function inferRegionFromSigunguField(sigunguField: string): ParsedFacilityRegion | null {
  const sigungu = sigunguField.trim();
  if (!sigungu) return null;

  const gwangjuDistrict = resolveGwangjuMetroDistrict(sigungu);
  if (gwangjuDistrict) {
    return { stage1: '광주광역시', stage2: gwangjuDistrict };
  }

  if (sigungu === '광주시') {
    return { stage1: '경기도', stage2: '광주시' };
  }

  if (JEONNAM_SIGUNGU_NAMES.has(sigungu)) {
    return { stage1: '전라남도', stage2: sigungu };
  }

  for (const sido of SIDO_LIST) {
    if (sigungu.startsWith(sido)) {
      return {
        stage1: sido,
        stage2: sigungu.slice(sido.length).trim() || sigungu,
      };
    }
  }

  return null;
}

/** 주소·시군구 필드에서 표준 시·도 / 시·군·구 추출 */
export function parseFacilityAddressRegion(
  address: string,
  sigunguField = '',
): ParsedFacilityRegion | null {
  const legacy = parseLegacyJeollanamGwangjuAddress(address);
  if (legacy) return legacy;

  const standard = parseStandardKoreanAddress(address);
  if (standard) return standard;

  const fromSigungu = inferRegionFromSigunguField(sigunguField);
  if (fromSigungu) return fromSigungu;

  return null;
}

function stripMetroPrefix(sigungu: string, stage1: string): string {
  const normalized = normalizeFacilityName(sigungu);
  if (stage1 === '광주광역시' && normalized.startsWith('광주')) {
    return normalized.slice('광주'.length);
  }
  if (stage1 === '울산광역시' && normalized.startsWith('울산')) {
    return normalized.slice('울산'.length);
  }
  if (stage1 === '부산광역시' && normalized.startsWith('부산')) {
    return normalized.slice('부산'.length);
  }
  return normalized;
}

/** 시·군·구 필터와 주소 파싱 결과 비교 (광주북구 ↔ 북구 등) */
export function matchesSigunguFilter(
  addressSigungu: string,
  filterSigungu: string,
  stage1: string,
  extraSigunguField = '',
): boolean {
  const filter = filterSigungu.trim();
  if (!filter) return true;

  const candidates = new Set<string>();
  const addCandidate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    candidates.add(normalizeFacilityName(trimmed));
    candidates.add(stripMetroPrefix(trimmed, stage1));
  };

  addCandidate(addressSigungu);
  addCandidate(extraSigunguField);
  addCandidate(filter);

  const normalizedFilter = normalizeFacilityName(filter);
  const strippedFilter = stripMetroPrefix(filter, stage1);

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate === normalizedFilter || candidate === strippedFilter) return true;
    if (candidate.includes(normalizedFilter) || normalizedFilter.includes(candidate)) return true;
    if (candidate.includes(strippedFilter) || strippedFilter.includes(candidate)) return true;
  }

  if (stage1 === '광주광역시') {
    const filterDistrict = resolveGwangjuMetroDistrict(filter);
    if (filterDistrict) {
      for (const candidate of candidates) {
        const addressDistrict = resolveGwangjuMetroDistrict(candidate);
        if (addressDistrict && addressDistrict === filterDistrict) return true;
      }
    }
  }

  return false;
}

function matchesFacilityRegionFallback(
  address: string,
  sigungu: string,
  filter: { stage1: string; stage2?: string },
): boolean {
  const filterStage1 = canonicalizeStage1(filter.stage1);
  const filterStage2 = filter.stage2?.trim() ?? '';
  const addr = address.trim();

  if (filterStage1 === '광주광역시') {
    if (/경기도\s*광주시/.test(addr)) return false;
    const legacy = parseLegacyJeollanamGwangjuAddress(addr);
    if (legacy) {
      if (legacy.stage1 !== filterStage1) return false;
      return !filterStage2 || matchesSigunguFilter(legacy.stage2, filterStage2, filterStage1, sigungu);
    }
    if (!addr.includes('광주광역시')) return false;
    return !filterStage2 || matchesSigunguFilter('', filterStage2, filterStage1, sigungu) || addr.includes(filterStage2);
  }

  if (filterStage1 === '경기도' && filterStage2 === '광주시') {
    return /경기도\s*광주시/.test(addr) || normalizeFacilityName(sigungu) === '광주시';
  }

  if (!addr.includes(filterStage1)) {
    return false;
  }

  if (!filterStage2) return true;

  return (
    matchesSigunguFilter('', filterStage2, filterStage1, sigungu) ||
    addr.includes(filterStage2) ||
    normalizeFacilityName(addr).includes(normalizeFacilityName(filterStage2))
  );
}

/** 파싱된 지역이 필터와 일치하는지 판별 */
export function matchesParsedFacilityRegion(
  parsed: ParsedFacilityRegion,
  filter: { stage1: string; stage2?: string },
  sigunguField = '',
): boolean {
  const filterStage1 = canonicalizeStage1(filter.stage1);
  if (parsed.stage1 !== filterStage1) return false;

  const filterStage2 = filter.stage2?.trim() ?? '';
  if (!filterStage2) return true;

  return matchesSigunguFilter(parsed.stage2, filterStage2, parsed.stage1, sigunguField);
}

/** 주소·시군구가 선택 지역과 일치하는지 판별 */
export function matchesFacilityAddressRegion(
  address: string,
  sigungu: string,
  filter: { stage1: string; stage2?: string },
): boolean {
  if (!filter?.stage1?.trim()) return true;

  const parsed = parseFacilityAddressRegion(address, sigungu);
  if (parsed) {
    return matchesParsedFacilityRegion(parsed, filter, sigungu);
  }

  return matchesFacilityRegionFallback(address, sigungu, filter);
}
