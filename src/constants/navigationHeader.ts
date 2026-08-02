import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import type { UtilitiesStackParamList } from '@/navigation/UtilitiesStackNavigator';
import { UTILITY_TOOL_ITEMS } from '@/constants/utilityTools';

/** 헤더 본문 높이 (safe area 제외) */
export const APP_NAV_HEADER_BODY_HEIGHT = 56;

/** 상단 헤더 로고 옆 브랜드 텍스트 */
export const APP_HEADER_BRAND_NAME = 'KON';

export const APP_NAV_HEADER_COLORS = {
  background: '#FFFFFF',
  border: '#E2E8F0',
  title: '#0F172A',
  subtitle: '#64748B',
  icon: '#334155',
  iconMuted: '#94A3B8',
  brand: '#DC2626',
  brandText: '#0F172A',
} as const;

export const MAIN_TAB_TITLES: Record<keyof MainTabParamList, string> = {
  Home: '홈',
  Guide: '응급 가이드',
  Map: '의료정보',
  EmsCall: '민간 구급차',
  Paramedic: EMS_COMMUNITY_TAB_LABEL,
};

export const SETTINGS_SCREEN_TITLE = '설정';

const utilityTitleByRoute = Object.fromEntries(
  UTILITY_TOOL_ITEMS.map((item) => [item.route, item.title]),
) as Record<keyof UtilitiesStackParamList, string>;

export const UTILITY_SCREEN_TITLES: Record<keyof UtilitiesStackParamList, string> = {
  ...utilityTitleByRoute,
  SymptomOtcGuide: '증상별 OTC 가이드',
};

export const CHEMICAL_SCREEN_TITLE = '약물정보찾기';

export const SETTINGS_NESTED_TITLES: Record<string, string> = {
  AdminDashboard: '관리자',
};
