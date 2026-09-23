import type { MedicineInfo } from '@/services/emergencyApi';
import {
  browseLocalMedicinesByChoseong,
  getDefaultBrowseMedicines,
  getEmergencyMedicineQuickItems,
  getEmergencyMedicineQuickItemsBySection,
  getBrowseMedicineCount,
  getLocalMedicineCount,
  searchLocalMedicines,
} from '@/services/medicineStore';
import {
  filterMedicinesByChoseong,
  type MedicineChoseongFilter,
} from '@/utils/medicineChoseong';

export const SEARCH_RESULT_LIMIT = 100;
export const BROWSE_RESULT_LIMIT = 300;
export const BROWSE_PAGE_SIZE = 48;
export const DEFAULT_BROWSE_COUNT = 40;

export function getMedicineDataNotice(): string | null {
  return `오프라인 내장 데이터 ${getLocalMedicineCount().toLocaleString('ko-KR')}건 · 네트워크 없이 즉시 검색`;
}

export function loadDefaultMedicines(): MedicineInfo[] {
  return getDefaultBrowseMedicines(DEFAULT_BROWSE_COUNT);
}

export function searchMedicinesByName(query: string): MedicineInfo[] {
  return searchLocalMedicines(query, SEARCH_RESULT_LIMIT);
}

export function loadMedicinesForChoseong(
  filter: MedicineChoseongFilter,
  limit = BROWSE_PAGE_SIZE,
  offset = 0,
): MedicineInfo[] {
  return browseLocalMedicinesByChoseong(filter, limit, offset);
}

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

export {
  browseLocalMedicinesByChoseong,
  getBrowseMedicineCount,
  getEmergencyMedicineQuickItems,
  getEmergencyMedicineQuickItemsBySection,
  getLocalMedicineCount,
  searchLocalMedicines,
};
