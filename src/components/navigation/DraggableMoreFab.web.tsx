import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_SHADOW } from '@/constants/appTheme';
import { DRAGGABLE_FAB_SIZE } from '@/constants/fabLayout';
import { useThemedColors } from '@/hooks/useThemedColors';
import { useMoreMenu } from '@/contexts/MoreMenuContext';
import { useShowGlobalMoreFab } from '@/hooks/useRootRoute';
import { useFabDragBounds } from '@/hooks/useFabDragBounds';

/** Web: Reanimated useAnimatedStyle 미지원 — 고정 위치 FAB */
export function DraggableMoreFab() {
  const { colors } = useThemedColors();
  const visible = useShowGlobalMoreFab();
  const bounds = useFabDragBounds();
  const { openMoreMenu } = useMoreMenu();
  const openMenuRef = useRef(openMoreMenu);
  openMenuRef.current = openMoreMenu;

  useEffect(() => {
    openMenuRef.current = openMoreMenu;
  }, [openMoreMenu]);

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable
        accessibilityLabel="더보기 메뉴"
        onPress={() => openMenuRef.current()}
        style={[
          styles.fab,
          {
            left: bounds.defaultX,
            top: bounds.defaultY,
            width: DRAGGABLE_FAB_SIZE,
            height: DRAGGABLE_FAB_SIZE,
            borderRadius: DRAGGABLE_FAB_SIZE / 2,
            backgroundColor: colors.blue,
            cursor: 'pointer',
          },
        ]}
      >
        <AppIcon name="dots-horizontal" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1100,
  },
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...APP_SHADOW.float,
  },
});
