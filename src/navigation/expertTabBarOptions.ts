import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 아이콘+라벨이 차지하는 고정 콘텐츠 높이 */
const TAB_CONTENT_HEIGHT = 52;
const TAB_TOP_PADDING = 8;
/** 홈 인디케이터/내비게이션 바 아래 추가 터치 여백 */
const TAB_BOTTOM_EXTRA = Platform.select({ ios: 6, android: 8, default: 6 }) ?? 6;
/** 인셋이 0인 기기(구형 Android 등) 최소 하단 여백 */
const MIN_BOTTOM_INSET = Platform.select({ ios: 20, android: 12, default: 12 }) ?? 12;

export type ExpertTabBarTheme = {
  activeTintColor: string;
  inactiveTintColor: string;
  backgroundColor: string;
  borderTopColor: string;
  labelFontSize?: number;
};

export type ExpertTabBarConfig = {
  screenOptions: BottomTabNavigationOptions;
  /** RN Navigation 기본 bottom inset과 이중 적용 방지 */
  safeAreaInsets: { top: number; right: number; bottom: number; left: number };
};

/**
 * 전문가용 Bottom Tab — useSafeAreaInsets 기반 하단 터치 여백.
 * iPhone 홈바·Android 내비게이션 바와 겹치지 않도록 paddingBottom/height 자동 계산.
 */
export function useExpertTabBarConfig(theme: ExpertTabBarTheme): ExpertTabBarConfig {
  const insets = useSafeAreaInsets();

  const safeBottom = Math.max(insets.bottom, MIN_BOTTOM_INSET);
  const paddingBottom = safeBottom + TAB_BOTTOM_EXTRA;
  const tabBarHeight = TAB_CONTENT_HEIGHT + TAB_TOP_PADDING + paddingBottom;

  return useMemo(
    () => ({
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      screenOptions: {
        headerShown: false,
        tabBarActiveTintColor: theme.activeTintColor,
        tabBarInactiveTintColor: theme.inactiveTintColor,
        tabBarStyle: {
          borderTopColor: theme.borderTopColor,
          backgroundColor: theme.backgroundColor,
          height: tabBarHeight,
          paddingTop: TAB_TOP_PADDING,
          paddingBottom,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: theme.labelFontSize ?? 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
      },
    }),
    [
      theme.activeTintColor,
      theme.inactiveTintColor,
      theme.backgroundColor,
      theme.borderTopColor,
      theme.labelFontSize,
      tabBarHeight,
      paddingBottom,
    ],
  );
}

/** DEV FAB 등 오버레이 UI가 탭 바 위에 올라갈 때 사용 */
export function useExpertTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, MIN_BOTTOM_INSET);
  const paddingBottom = safeBottom + TAB_BOTTOM_EXTRA;
  return TAB_CONTENT_HEIGHT + TAB_TOP_PADDING + paddingBottom;
}
