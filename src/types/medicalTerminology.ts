export type MedicalTerminology = {
  korean: string;
  english: string;
  category: string;
};

export const TERMINOLOGY_CHOSEONG_CATEGORIES = [
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
] as const;

export const TERMINOLOGY_ALPHA_CATEGORIES = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
] as const;

export type TerminologyChoseongCategory = (typeof TERMINOLOGY_CHOSEONG_CATEGORIES)[number];
export type TerminologyAlphaCategory = (typeof TERMINOLOGY_ALPHA_CATEGORIES)[number];

export type TerminologyCategoryFilter =
  | '전체'
  | TerminologyChoseongCategory
  | TerminologyAlphaCategory;
