import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_COLORS, APP_SHADOW } from '@/constants/appTheme';
import { useMoreMenu } from '@/contexts/MoreMenuContext';
import { useRootRoute, useShowGlobalMoreFab } from '@/hooks/useRootRoute';
import { useExpertTabBarHeight } from '@/navigation/expertTabBarOptions';

const FAB_SIZE = 52;

/**
 * 탭 바 상단과 FAB 하단 사이 여백 — 하단 리스트·탭 콘텐츠 가림 방지 (70~90px)
 */
const FAB_GAP_ABOVE_TAB_BAR = 80;

/** 유틸리티 모달(탭 바 없음) 하단 여백 */
const FAB_UTILITIES_BOTTOM_PADDING = 28;

/**
 * 글로벌 플로팅 더보기(FAB) — 루트 오버레이에서 항상 노출
 */
export function MoreMenuFab() {
  const insets = useSafeAreaInsets();
  const rootRoute = useRootRoute();
  const visible = useShowGlobalMoreFab();
  const mainTabBarHeight = useExpertTabBarHeight(true);
  const expertTabBarHeight = useExpertTabBarHeight(false);
  const { openMoreMenu } = useMoreMenu();

  if (!visible) {
    return null;
  }

  const tabBarHeight = rootRoute === 'Expert' ? expertTabBarHeight : mainTabBarHeight;
  const isFullScreenOverlay = rootRoute === 'Utilities' || rootRoute === 'Chemical';
  const bottomOffset = isFullScreenOverlay
    ? Math.max(insets.bottom, 12) + FAB_UTILITIES_BOTTOM_PADDING
    : tabBarHeight + FAB_GAP_ABOVE_TAB_BAR;

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.layer]}
    >
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: 0,
          bottom: bottomOffset,
          paddingRight: Math.max(insets.right, 16),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="더보기 메뉴"
          onPress={openMoreMenu}
          className="active:opacity-90"
        >
          <View
            style={{
              width: FAB_SIZE,
              height: FAB_SIZE,
              borderRadius: FAB_SIZE / 2,
              backgroundColor: APP_COLORS.blue,
              alignItems: 'center',
              justifyContent: 'center',
              ...APP_SHADOW.float,
            }}
          >
            <AppIcon name="plus" size={28} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 1000,
    elevation: 100,
  },
});
