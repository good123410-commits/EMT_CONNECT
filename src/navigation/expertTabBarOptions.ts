import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 아이콘+라벨이 차지하는 고정 콘텐츠 높이 */
const TAB_CONTENT_HEIGHT_DEFAULT = 52;
const TAB_CONTENT_HEIGHT_COMPACT = 44;
const TAB_TOP_PADDING_DEFAULT = 8;
const TAB_TOP_PADDING_COMPACT = 4;
/** 홈 인디케이터/내비게이션 바 아래 추가 터치 여백 */
const TAB_BOTTOM_EXTRA = Platform.select({ ios: 6, android: 8, default: 6 }) ?? 6;
/** 메인 하단 탭 위 EMS 서브 탭 — 탭 내부 하단 패딩 */
const NESTED_TAB_BOTTOM_GAP = Platform.select({ ios: 12, android: 10, default: 12 }) ?? 12;
/** 메인 하단 탭과 EMS 서브 탭 사이 외부 여백 */
const NESTED_TAB_MARGIN_ABOVE_MAIN = Platform.select({ ios: 18, android: 14, default: 16 }) ?? 16;
/** 인셋이 0인 기기(구형 Android 등) 최소 하단 여백 */
const MIN_BOTTOM_INSET = Platform.select({ ios: 20, android: 12, default: 12 }) ?? 12;

export type ExpertTabBarTheme = {
  activeTintColor: string;
  inactiveTintColor: string;
  backgroundColor: string;
  borderTopColor: string;
  labelFontSize?: number;
  tabBarItemPaddingHorizontal?: number;
  /** 상단 구분선 숨김 (토스 스타일) */
  hideTopBorder?: boolean;
  /** 하단 구분선 표시 (상단 탭용) */
  showBottomBorder?: boolean;
  /** 메인 6탭 — 균등 분할·촘촘한 아이콘/라벨 */
  compactLayout?: boolean;
  /** 메인 하단 탭 위 EMS 서브 탭 — 하단 safe area 패딩 생략 */
  nestedAboveMainTabBar?: boolean;
  /** 탭바 위치 */
  position?: 'top' | 'bottom';
};

export type ExpertTabBarMetricsOptions = {
  compact?: boolean;
  nestedAboveMainTabBar?: boolean;
  position?: 'top' | 'bottom';
};

export type ExpertTabBarMetrics = {
  tabContentHeight: number;
  tabTopPadding: number;
  paddingBottom: number;
  paddingTop: number;
  marginBottom: number;
  tabBarHeight: number;
  /** 리스트 하단 inset — 탭바 높이 + 메인 탭과의 간격 */
  occupiedBottomSpace: number;
};

export function getExpertTabBarMetrics(
  insetsBottom: number,
  options: ExpertTabBarMetricsOptions = {},
): ExpertTabBarMetrics {
  const compact = options.compact ?? false;
  const nested = options.nestedAboveMainTabBar ?? false;
  const position = options.position ?? 'bottom';

  if (position === 'top') {
    const tabContentHeight = compact ? TAB_CONTENT_HEIGHT_COMPACT : TAB_CONTENT_HEIGHT_DEFAULT;
    const tabTopPadding = 0;
    const paddingTop = 4;
    const paddingBottom = 8;
    const tabBarHeight = tabContentHeight + paddingTop + paddingBottom;
    return {
      tabContentHeight,
      tabTopPadding,
      paddingTop,
      paddingBottom,
      marginBottom: 0,
      tabBarHeight,
      occupiedBottomSpace: 0, // 상단 탭은 하단 공간을 차지하지 않음
    };
  }

  if (nested) {
    const tabContentHeight = compact ? TAB_CONTENT_HEIGHT_COMPACT : TAB_CONTENT_HEIGHT_DEFAULT;
    const tabTopPadding = compact ? TAB_TOP_PADDING_COMPACT : TAB_TOP_PADDING_DEFAULT;
    const paddingBottom = NESTED_TAB_BOTTOM_GAP;
    const marginBottom = NESTED_TAB_MARGIN_ABOVE_MAIN;
    const tabBarHeight = tabContentHeight + tabTopPadding + paddingBottom;
    return {
      tabContentHeight,
      tabTopPadding,
      paddingBottom,
      marginBottom,
      tabBarHeight,
      occupiedBottomSpace: tabBarHeight + marginBottom,
    };
  }

  const tabContentHeight = compact ? TAB_CONTENT_HEIGHT_COMPACT : TAB_CONTENT_HEIGHT_DEFAULT;
  const tabTopPadding = compact ? TAB_TOP_PADDING_COMPACT : TAB_TOP_PADDING_DEFAULT;
  const safeBottom = Math.max(insetsBottom, MIN_BOTTOM_INSET);
  const paddingBottom = safeBottom + TAB_BOTTOM_EXTRA;

  return {
    tabContentHeight,
    tabTopPadding,
    paddingBottom,
    marginBottom: 0,
    tabBarHeight: tabContentHeight + tabTopPadding + paddingBottom,
    occupiedBottomSpace: tabContentHeight + tabTopPadding + paddingBottom,
  };
}

export type ExpertTabBarConfig = {
  screenOptions: BottomTabNavigationOptions;
  /** RN Navigation 기본 bottom inset과 이중 적용 방지 */
  safeAreaInsets: { top: number; right: number; bottom: number; left: number };
  tabBarHeight: number;
};

/**
 * 전문가용 Bottom Tab — useSafeAreaInsets 기반 하단 터치 여백.
 * iPhone 홈바·Android 내비게이션 바와 겹치지 않도록 paddingBottom/height 자동 계산.
 */
export function useExpertTabBarConfig(theme: ExpertTabBarTheme): ExpertTabBarConfig {
  const insets = useSafeAreaInsets();
  const compact = theme.compactLayout ?? false;
  const nestedAboveMainTabBar = theme.nestedAboveMainTabBar ?? false;
  const position = theme.position ?? 'bottom';
  const metrics = getExpertTabBarMetrics(insets.bottom, { compact, nestedAboveMainTabBar, position });

  return useMemo(
    () => ({
      tabBarHeight: metrics.tabBarHeight,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      screenOptions: {
        headerShown: false,
        tabBarActiveTintColor: theme.activeTintColor,
        tabBarInactiveTintColor: theme.inactiveTintColor,
        tabBarPosition: position,
        tabBarStyle: {
          borderTopWidth: position === 'bottom' ? (theme.hideTopBorder ? 0 : 1) : 0,
          borderTopColor: theme.borderTopColor,
          borderBottomWidth: position === 'top' ? (theme.showBottomBorder ? 1 : 0) : 0,
          borderBottomColor: theme.borderTopColor,
          backgroundColor: theme.backgroundColor,
          height: metrics.tabBarHeight,
          paddingTop: metrics.paddingTop ?? metrics.tabTopPadding,
          paddingBottom: metrics.paddingBottom,
          paddingHorizontal: 0,
          marginBottom: metrics.marginBottom,
          width: '100%',
          alignSelf: 'stretch',
          elevation: position === 'top' ? 0 : 4,
          shadowOpacity: position === 'top' ? 0 : 0.1,
        },
        tabBarItemStyle: {
          flex: 1,
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'stretch',
          paddingTop: 0,
          paddingBottom: 0,
          minWidth: 0,
          maxWidth: '100%',
          paddingHorizontal: compact ? 0 : (theme.tabBarItemPaddingHorizontal ?? 0),
          marginHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: theme.labelFontSize ?? (position === 'top' ? 13 : 11),
          fontFamily: 'Pretendard-SemiBold',
          marginTop: position === 'top' ? 0 : 2,
          marginBottom: 0,
        },
        tabBarAllowFontScaling: false,
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
          display: position === 'top' ? 'none' : 'flex',
        },
      },
    }),
    [
      compact,
      position,
      metrics.marginBottom,
      metrics.paddingBottom,
      metrics.paddingTop,
      metrics.tabTopPadding,
      metrics.tabBarHeight,
      theme.activeTintColor,
      theme.backgroundColor,
      theme.borderTopColor,
      theme.inactiveTintColor,
      theme.labelFontSize,
      theme.tabBarItemPaddingHorizontal,
      theme.hideTopBorder,
      theme.showBottomBorder,
    ],
  );
}

/** DEV FAB 등 오버레이 UI가 탭 바 위에 올라갈 때 사용 */
export function useExpertTabBarHeight(
  compact = false,
  options: Omit<ExpertTabBarMetricsOptions, 'compact'> = {},
): number {
  const insets = useSafeAreaInsets();
  return getExpertTabBarMetrics(insets.bottom, { compact, ...options }).occupiedBottomSpace;
}
