import {
  fetchInitialMedicines,
  fetchMedicineBrowse,
  searchMedicine,
  type MedicineInfo,
} from '@/services/emergencyApi';
import { hasPortalApiKey } from '@/constants/env';
import {
  filterMedicinesByChoseong,
  type MedicineChoseongFilter,
} from '@/utils/medicineChoseong';

export const INITIAL_MEDICINE_COUNT = 30;
/** 초성 필터용 클라이언트 풀 — 넉넉히 로드 후 itemName 기준 필터 */
export const CHOSEONG_BROWSE_COUNT = 300;
export const SEARCH_PAGE_SIZE = 30;
export const BROWSE_PAGE_SIZE = 25;

/** API 키 없이 샘플 데이터를 쓰는 경우 화면 안내 문구 */
export function getMedicineDataNotice(): string | null {
  if (hasPortalApiKey()) return null;
  return '공공데이터 API 키가 설정되지 않아 샘플 의약품 정보를 표시합니다. 전체 검색은 .env의 EXPO_PUBLIC_PORTAL_API_KEY 설정 후 앱을 다시 실행하세요.';
}

export async function loadDefaultMedicines(): Promise<MedicineInfo[]> {
  return fetchInitialMedicines(INITIAL_MEDICINE_COUNT);
}

/** 초성 필터 시 API 대량 로드 — 필터링은 UI에서 itemName 기준 수행 */
export async function loadMedicineBrowsePool(
  numOfRows = CHOSEONG_BROWSE_COUNT,
): Promise<MedicineInfo[]> {
  return fetchMedicineBrowse({ pageNo: 1, numOfRows });
}

export async function searchMedicinesByName(query: string): Promise<MedicineInfo[]> {
  return searchMedicine({
    itemName: query.trim(),
    numOfRows: SEARCH_PAGE_SIZE,
  });
}

export async function loadMoreMedicines(pageNo: number): Promise<MedicineInfo[]> {
  return fetchMedicineBrowse({
    pageNo,
    numOfRows: BROWSE_PAGE_SIZE,
  });
}

/** itemName(제품명) 초성 필터 — entpName 등 다른 필드 사용 금지 */
export function applyChoseongFilter(
  items: MedicineInfo[],
  filter: MedicineChoseongFilter,
): MedicineInfo[] {
  return filterMedicinesByChoseong(items, filter);
}

export function filterMedicineListByChoseong(
  items: MedicineInfo[],
  filter: MedicineChoseongFilter,
): MedicineInfo[] {
  return applyChoseongFilter(items, filter);
}

/** @deprecated loadMedicineBrowsePool + applyChoseongFilter 사용 */
export async function loadMedicinesForChoseong(
  filter: MedicineChoseongFilter,
): Promise<MedicineInfo[]> {
  if (filter === '전체') return loadDefaultMedicines();
  const pool = await loadMedicineBrowsePool();
  return applyChoseongFilter(pool, filter).slice(0, SEARCH_PAGE_SIZE);
}
