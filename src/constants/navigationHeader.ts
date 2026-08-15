import { APP_COLORS } from '@/constants/appTheme';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import type { UtilitiesStackParamList } from '@/navigation/UtilitiesStackNavigator';
import { UTILITY_TOOL_ITEMS } from '@/constants/utilityTools';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { getNavHeaderColors } from '@/theme/theme';
import type { AppColorPalette } from '@/constants/appThemes';

/** 헤더 본문 높이 (safe area 제외) */
export const APP_NAV_HEADER_BODY_HEIGHT = 56;

/** 상단 헤더 로고 옆 브랜드 텍스트 */
export const APP_HEADER_BRAND_NAME = 'KON';

/** @deprecated useAppTheme().navHeader 또는 getNavHeaderColors() 사용 */
export const APP_NAV_HEADER_COLORS = getNavHeaderColors(APP_COLORS);

export function createStackHeaderOptions(
  palette: AppColorPalette,
): NativeStackNavigationOptions {
  const header = getNavHeaderColors(palette);
  return {
    headerStyle: { backgroundColor: header.background },
    headerTintColor: header.icon,
    headerTitleStyle: {
      color: header.title,
      fontFamily: 'Pretendard-SemiBold',
      fontSize: 16,
    },
    headerShadowVisible: false,
  };
}

/** React Navigation 스택/탭 헤더 일괄 옵션 (headerShown: true 인 화면용) */
export const APP_STACK_HEADER_OPTIONS = createStackHeaderOptions(APP_COLORS);

export const APP_TAB_HEADER_OPTIONS = {
  ...APP_STACK_HEADER_OPTIONS,
} as const satisfies BottomTabNavigationOptions;

export const MAIN_TAB_TITLES: Record<keyof MainTabParamList, string> = {
  Home: '홈',
  Guide: '응급 가이드',
  Map: '안전지도',
  Paramedic: EMS_COMMUNITY_TAB_LABEL,
  All: '전체',
};

export const SETTINGS_SCREEN_TITLE = '설정';

const utilityTitleByRoute = Object.fromEntries(
  UTILITY_TOOL_ITEMS.map((item) => [item.route, item.title]),
) as Record<keyof UtilitiesStackParamList, string>;

export const UTILITY_SCREEN_TITLES: Record<keyof UtilitiesStackParamList, string> = {
  ...utilityTitleByRoute,
  LocalCommunityTalk: '우리동네 토크',
  SymptomOtcGuide: '증상별 OTC 가이드',
};

export const CHEMICAL_SCREEN_TITLE = '약물정보찾기';

export const SETTINGS_NESTED_TITLES: Record<string, string> = {
  AdminDashboard: '관리자',
};
