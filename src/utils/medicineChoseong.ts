/** 한글 유니코드 초성 인덱스 (0~18) → ㄱ, ㄲ, ㄴ, … ㅎ */
export const CHOSEONG_LIST = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

export type MedicineChoseongFilter = '전체' | (typeof CHOSEONG_LIST)[number] | 'A-Z';

export const MEDICINE_CHOSEONG_FILTERS: MedicineChoseongFilter[] = [
  '전체',
  'ㄱ',
  'ㄴ',
  'ㄷ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅅ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
  'A-Z',
];

const HANGUL_SYLLABLE_BASE = 44032; // '가'.charCodeAt(0)
const JUNGSEONG_COUNT = 28;
const CHOSEONG_COUNT = 21;

/** UI 패널 자음 → 실제 초성 인덱스 (쌍자음 포함) */
const FILTER_TO_CHOSEONG_INDICES: Record<string, number[]> = {
  'ㄱ': [0, 1],
  'ㄴ': [2],
  'ㄷ': [3, 4],
  'ㄹ': [5],
  'ㅁ': [6],
  'ㅂ': [7, 8],
  'ㅅ': [9, 10],
  'ㅇ': [11],
  'ㅈ': [12, 13],
  'ㅊ': [14],
  'ㅋ': [15],
  'ㅌ': [16],
  'ㅍ': [17],
  'ㅎ': [18],
};

/**
 * 한글 음절 1글자 → 초성 인덱스 (0~18)
 * 공식: Math.floor(((code - 44032) / 28) / 21)
 */
export function getChoseongIndex(char: string): number | null {
  if (!char) return null;
  const code = char.charCodeAt(0);
  if (code < HANGUL_SYLLABLE_BASE || code > 0xd7a3) return null;
  return Math.floor(((code - HANGUL_SYLLABLE_BASE) / JUNGSEONG_COUNT) / CHOSEONG_COUNT);
}

export function getChoseongOfChar(char: string): MedicineChoseongFilter | '' {
  const index = getChoseongIndex(char);
  if (index === null) {
    if (/[a-zA-Z]/.test(char)) return 'A-Z';
    return '';
  }
  return CHOSEONG_LIST[index];
}

/** 제품명(itemName)만 사용 — 앞쪽 공백·기호·숫자는 건너뜀 */
export function extractFirstChoseongFromItemName(itemName: string | null | undefined): string {
  const name = itemName?.trim() ?? '';
  if (!name) return '';

  for (let i = 0; i < name.length; i += 1) {
    const char = name[i];
    const choseong = getChoseongOfChar(char);
    if (choseong) return choseong;
  }

  return '';
}

export function matchesMedicineChoseong(
  itemName: string | null | undefined,
  filter: MedicineChoseongFilter,
): boolean {
  if (filter === '전체') return true;

  const name = itemName?.trim() ?? '';
  if (!name) return false;

  if (filter === 'A-Z') {
    return /^[a-zA-Z]/.test(name);
  }

  const firstIndex = getChoseongIndex(findFirstHangulChar(name) ?? '');
  if (firstIndex === null) return false;

  const allowedIndices = FILTER_TO_CHOSEONG_INDICES[filter];
  if (!allowedIndices) return false;

  return allowedIndices.includes(firstIndex);
}

function findFirstHangulChar(name: string): string | null {
  for (let i = 0; i < name.length; i += 1) {
    const char = name[i];
    if (getChoseongIndex(char) !== null) return char;
    if (/[a-zA-Z]/.test(char)) return char;
  }
  return null;
}

/** 반드시 itemName(제품명) 필드만 검사 */
export function filterMedicinesByChoseong<T extends { itemName?: string | null }>(
  items: T[],
  filter: MedicineChoseongFilter,
): T[] {
  if (filter === '전체') return items;
  if (!Array.isArray(items) || items.length === 0) return [];

  return items.filter((item) => matchesMedicineChoseong(item?.itemName, filter));
}
