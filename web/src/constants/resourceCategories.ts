export const RESOURCE_CATEGORIES = [
  { value: 'general', label: '일반' },
  { value: 'form', label: '서식' },
  { value: 'guideline', label: '지침' },
  { value: 'manual', label: '매뉴얼' },
  { value: 'education', label: '교육자료' },
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]['value'];

export function getResourceCategoryLabel(category: string): string {
  return RESOURCE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
