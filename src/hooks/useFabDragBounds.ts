import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigationHeaderHeight } from '@/components/navigation/AppNavigationHeader';
import {
  DRAGGABLE_FAB_SIZE,
  FAB_HORIZONTAL_MARGIN,
  FAB_MARGIN_ABOVE_TAB_BAR,
  FAB_MARGIN_BELOW_HEADER,
  FAB_OVERLAY_BOTTOM_PADDING,
} from '@/constants/fabLayout';
import { useRootRoute } from '@/hooks/useRootRoute';
import { useExpertTabBarHeight } from '@/navigation/expertTabBarOptions';

export type FabDragBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  defaultX: number;
  defaultY: number;
  screenWidth: number;
};

export function useFabDragBounds(): FabDragBounds {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useAppNavigationHeaderHeight();
  const rootRoute = useRootRoute();
  const mainTabBarHeight = useExpertTabBarHeight(true, { iconOnly: true });
  const expertTabBarHeight = useExpertTabBarHeight(false);

  return useMemo(() => {
    const hasTabBar = rootRoute === 'Main' || rootRoute === 'Expert';
    const tabBarHeight = rootRoute === 'Expert' ? expertTabBarHeight : mainTabBarHeight;

    const bottomClearance = hasTabBar
      ? tabBarHeight + FAB_MARGIN_ABOVE_TAB_BAR
      : Math.max(insets.bottom, 12) + FAB_OVERLAY_BOTTOM_PADDING;

    const minX = Math.max(insets.left, FAB_HORIZONTAL_MARGIN);
    const maxX = screenWidth - DRAGGABLE_FAB_SIZE - Math.max(insets.right, FAB_HORIZONTAL_MARGIN);
    const minY = headerHeight + FAB_MARGIN_BELOW_HEADER;
    const maxY = Math.max(minY, screenHeight - bottomClearance - DRAGGABLE_FAB_SIZE);

    return {
      minX,
      maxX,
      minY,
      maxY,
      defaultX: maxX,
      defaultY: maxY,
      screenWidth,
    };
  }, [
    expertTabBarHeight,
    headerHeight,
    insets.bottom,
    insets.left,
    insets.right,
    mainTabBarHeight,
    rootRoute,
    screenHeight,
    screenWidth,
  ]);
}
