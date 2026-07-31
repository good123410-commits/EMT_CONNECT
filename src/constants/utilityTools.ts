import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { UtilitiesStackParamList } from '@/navigation/UtilitiesStackNavigator';

export type UtilityToolRoute = keyof UtilitiesStackParamList;

export type UtilityToolItem = {
  id: string;
  route: UtilityToolRoute;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  accentBg: string;
};

/** 더보기 핵심 4종 — 해열제 계산 · 복용 타이머 · 비상 카드 · 생활권 커뮤니티 */
export const UTILITY_TOOL_ITEMS: UtilityToolItem[] = [
  {
    id: 'pediatric-antipyretic',
    route: 'PediatricAntipyreticCalc',
    title: '소아 해열진통제 계산기',
    icon: 'thermometer',
    accent: '#60A5FA',
    accentBg: '#1A2A40',
  },
  {
    id: 'medication-log-timer',
    route: 'MedicationLogTimer',
    title: '약물 복용 기록지 및 타이머',
    icon: 'alarm',
    accent: '#3B82F6',
    accentBg: '#1A2332',
  },
  {
    id: 'emergency-contact-card',
    route: 'EmergencyContactCard',
    title: '나의 비상 연락망 & 응급 의료 정보 카드',
    icon: 'card-account-details-outline',
    accent: '#93C5FD',
    accentBg: '#1E2A38',
  },
  {
    id: 'local-community-talk',
    route: 'LocalCommunityTalk',
    title: '우리동네 토크',
    icon: 'forum-outline',
    accent: '#34D399',
    accentBg: '#1A2E28',
  },
];
