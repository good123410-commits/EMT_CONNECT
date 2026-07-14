import type { Ionicons } from '@expo/vector-icons';

export type GuideIconId = keyof typeof Ionicons.glyphMap;

export type GuideIconOption = {
  id: GuideIconId;
  label: string;
};

/** 관리자가 분류 아이콘으로 선택할 수 있는 목록 */
export const GUIDE_ICON_OPTIONS: GuideIconOption[] = [
  { id: 'flame', label: '화상' },
  { id: 'heart', label: '심장' },
  { id: 'body', label: '신체' },
  { id: 'fitness', label: '골절' },
  { id: 'water', label: '출혈' },
  { id: 'snow', label: '저체온' },
  { id: 'medkit', label: '응급' },
  { id: 'pulse', label: '맥박' },
  { id: 'thermometer', label: '체온' },
  { id: 'bandage', label: '상처' },
  { id: 'skull', label: '두부' },
  { id: 'eye', label: '눈' },
  { id: 'hand-left', label: '손' },
  { id: 'walk', label: '이동' },
  { id: 'warning', label: '주의' },
  { id: 'shield-checkmark', label: '안전' },
  { id: 'nutrition', label: '영양' },
  { id: 'bug', label: '벌레' },
  { id: 'fish', label: '해양' },
  { id: 'leaf', label: '식물' },
];

export const DEFAULT_GUIDE_ICON: GuideIconId = 'medkit';

export function isGuideIconId(value: string): value is GuideIconId {
  return GUIDE_ICON_OPTIONS.some((option) => option.id === value);
}

export function resolveGuideIcon(icon?: string | null): GuideIconId {
  if (icon && isGuideIconId(icon)) return icon;
  return DEFAULT_GUIDE_ICON;
}
