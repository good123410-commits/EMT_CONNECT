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

/** 더보기 응급 유틸 — 해열제 계산 · 복용 타이머 · 의학용어 사전 */
export const UTILITY_TOOL_ITEMS: UtilityToolItem[] = [
  {
    id: 'emergency-response',
    route: 'EmergencyResponse',
    title: '응급 정보 및 위치 문자',
    icon: 'message-alert-outline',
    accent: '#F87171',
    accentBg: '#3A1F1F',
  },
  {
    id: 'medical-terminology',
    route: 'MedicalTerminology',
    title: '의학용어 사전',
    icon: 'book-open-variant',
    accent: '#34D399',
    accentBg: '#1A2E28',
  },
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
  // DISABLED: 비상연락망 & 응급카드 (ICE)
  // {
  //   id: 'emergency-contact-card',
  //   route: 'EmergencyContactCard',
  //   title: '나의 비상 연락망 & 응급 의료 정보 카드',
  //   icon: 'card-account-details-outline',
  //   accent: '#93C5FD',
  //   accentBg: '#1E2A38',
  // },
];
