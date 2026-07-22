import hospitalData from '@/data/generated/hospital_data.json';
import pharmacyData from '@/data/generated/pharmacy_data.json';
import { SIDO_LIST } from '@/services/locationService';
import { normalizeFacilityName } from '@/services/localFacilityStore';
import type { LocalHospitalRecord, LocalPharmacyRecord } from '@/types/localFacility';

const HOSPITALS = hospitalData as LocalHospitalRecord[];
const PHARMACIES = pharmacyData as LocalPharmacyRecord[];

const sigunguCache = new Map<string, string[]>();

function collectSigunguForSido(
  items: Array<{ a?: string; sg?: string }>,
  sido: string,
  target: Set<string>,
) {
  const sidoKey = normalizeFacilityName(sido);

  for (const item of items) {
    const address = item.a ?? '';
    if (!normalizeFacilityName(address).includes(sidoKey)) continue;

    if (item.sg?.trim()) {
      target.add(item.sg.trim());
      continue;
    }

    const match = address.match(/(?:특별자치시|특별시|광역시|특별자치도|도)\s+([\S]+(?:시|군|구))/);
    if (match?.[1]) target.add(match[1]);
  }
}

/** 로컬 병원·약국 데이터에서 시도별 시군구 목록 추출 */
export function getSigunguOptionsForSido(sido: string): string[] {
  if (!sido) return [];

  const cached = sigunguCache.get(sido);
  if (cached) return cached;

  const set = new Set<string>();
  collectSigunguForSido(HOSPITALS, sido, set);
  collectSigunguForSido(PHARMACIES, sido, set);

  const list = [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  sigunguCache.set(sido, list);
  return list;
}

export function getSidoOptions(): readonly string[] {
  return SIDO_LIST;
}
