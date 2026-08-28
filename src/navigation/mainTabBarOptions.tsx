import { useAppTheme } from '@/contexts/AppThemeContext';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';

/** 메인 하단 탭 — 토스 스타일 미니멀 5탭 (아이콘 온리) */
export function useMainTabBarConfig() {
  const { colors } = useAppTheme();
  const base = useExpertTabBarConfig({
    activeTintColor: colors.tabActive,
    inactiveTintColor: colors.tabInactive,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    compactLayout: true,
    iconOnlyLayout: true,
    tabBarItemPaddingHorizontal: 0,
    hideTopBorder: true,
  });

  return {
    ...base,
    sceneBackgroundColor: colors.background,
    screenOptions: {
      ...base.screenOptions,
      tabBarShowLabel: false,
      tabBarIconStyle: {
        marginTop: 0,
        marginBottom: 0,
      },
      tabBarItemStyle: {
        ...(base.screenOptions.tabBarItemStyle as object),
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  };
}
