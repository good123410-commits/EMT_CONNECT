import { APP_COLORS } from '@/constants/appTheme';
import { MainTabBarLabel } from '@/components/navigation/MainTabBarLabel';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

/** 메인 하단 탭 — 5탭 균등 분할·컴팩트 라벨 */
export function useMainTabBarConfig() {
  const base = useExpertTabBarConfig({
    activeTintColor: APP_COLORS.tabActive,
    inactiveTintColor: APP_COLORS.tabInactive,
    backgroundColor: APP_COLORS.surface,
    borderTopColor: APP_COLORS.border,
    compactLayout: true,
    tabBarItemPaddingHorizontal: 0,
  });

  const tabBarButton: BottomTabNavigationOptions['tabBarButton'] = (props) => (
    <PlatformPressable
      {...props}
      style={[
        props.style,
        {
          flex: 1,
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 0,
          marginHorizontal: 0,
        },
      ]}
    />
  );

  return {
    ...base,
    screenOptions: {
      ...base.screenOptions,
      tabBarLabel: MainTabBarLabel,
      tabBarLabelPosition: 'below-icon' as const,
      tabBarButton,
    },
  };
}
