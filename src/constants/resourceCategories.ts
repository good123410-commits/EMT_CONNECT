/** 웹 자료실과 동일 분류 — value는 DB 저장값 */
export const KEMIX_RESOURCE_CATEGORIES = [
  { value: 'general', label: '일반' },
  { value: 'form', label: '서식' },
  { value: 'guideline', label: '지침' },
  { value: 'manual', label: '매뉴얼' },
  { value: 'education', label: '교육자료' },
] as const;

export type KemixResourceCategory = (typeof KEMIX_RESOURCE_CATEGORIES)[number]['value'];

export function getResourceCategoryLabel(category: string): string {
  return KEMIX_RESOURCE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
