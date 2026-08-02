import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_COLORS, APP_SHADOW } from '@/constants/appTheme';
import {
  DRAGGABLE_FAB_SIZE,
  FAB_DRAG_SPRING,
  FAB_SNAP_SPRING,
} from '@/constants/fabLayout';
import { useMoreMenu } from '@/contexts/MoreMenuContext';
import { useFabDragBounds } from '@/hooks/useFabDragBounds';
import { useFabPositionStorage } from '@/hooks/useFabPositionStorage';
import { useShowGlobalMoreFab } from '@/hooks/useRootRoute';

function clampWorklet(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/**
 * 드래그 가능한 글로벌 더보기 FAB — 짧은 탭으로 메뉴, 길게 눌러 드래그
 */
export function DraggableMoreFab() {
  const visible = useShowGlobalMoreFab();
  const bounds = useFabDragBounds();
  const { openMoreMenu } = useMoreMenu();
  const { position, ready, persistPosition } = useFabPositionStorage();

  const posX = useSharedValue(bounds.defaultX);
  const posY = useSharedValue(bounds.defaultY);
  const scale = useSharedValue(1);
  const dragOrigin = useSharedValue({ x: 0, y: 0 });

  const boundsMinX = useSharedValue(bounds.minX);
  const boundsMaxX = useSharedValue(bounds.maxX);
  const boundsMinY = useSharedValue(bounds.minY);
  const boundsMaxY = useSharedValue(bounds.maxY);
  const screenWidth = useSharedValue(bounds.screenWidth);

  const hasInitialized = useRef(false);
  const openMenuRef = useRef(openMoreMenu);
  openMenuRef.current = openMoreMenu;

  const handleOpenMenu = () => {
    openMenuRef.current();
  };

  const savePosition = (x: number, y: number) => {
    void persistPosition({ x, y });
  };

  useEffect(() => {
    boundsMinX.value = bounds.minX;
    boundsMaxX.value = bounds.maxX;
    boundsMinY.value = bounds.minY;
    boundsMaxY.value = bounds.maxY;
    screenWidth.value = bounds.screenWidth;

    if (!ready) return;

    if (!hasInitialized.current) {
      const x = position?.x ?? bounds.defaultX;
      const y = position?.y ?? bounds.defaultY;
      posX.value = Math.min(Math.max(x, bounds.minX), bounds.maxX);
      posY.value = Math.min(Math.max(y, bounds.minY), bounds.maxY);
      hasInitialized.current = true;
      return;
    }

    posX.value = withSpring(
      Math.min(Math.max(posX.value, bounds.minX), bounds.maxX),
      FAB_DRAG_SPRING,
    );
    posY.value = withSpring(
      Math.min(Math.max(posY.value, bounds.minY), bounds.maxY),
      FAB_DRAG_SPRING,
    );
  }, [
    bounds,
    boundsMaxX,
    boundsMaxY,
    boundsMinX,
    boundsMinY,
    position,
    posX,
    posY,
    ready,
    screenWidth,
  ]);

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(handleOpenMenu)();
    });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(220)
    .minDistance(4)
    .onStart(() => {
      dragOrigin.value = { x: posX.value, y: posY.value };
      scale.value = withSpring(1.08, FAB_DRAG_SPRING);
    })
    .onUpdate((event) => {
      posX.value = clampWorklet(
        dragOrigin.value.x + event.translationX,
        boundsMinX.value,
        boundsMaxX.value,
      );
      posY.value = clampWorklet(
        dragOrigin.value.y + event.translationY,
        boundsMinY.value,
        boundsMaxY.value,
      );
    })
    .onEnd((event) => {
      const centerX = posX.value + DRAGGABLE_FAB_SIZE / 2;
      const snappedX =
        centerX < screenWidth.value / 2 ? boundsMinX.value : boundsMaxX.value;
      const snappedY = clampWorklet(posY.value, boundsMinY.value, boundsMaxY.value);

      posX.value = withSpring(snappedX, {
        ...FAB_SNAP_SPRING,
        velocity: event.velocityX,
      });
      posY.value = withSpring(snappedY, {
        ...FAB_SNAP_SPRING,
        velocity: event.velocityY,
      });
      scale.value = withSpring(1, FAB_DRAG_SPRING);
      runOnJS(savePosition)(snappedX, snappedY);
    })
    .onFinalize(() => {
      scale.value = withSpring(1, FAB_DRAG_SPRING);
    });

  const gesture = Gesture.Race(tapGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    left: posX.value,
    top: posY.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) {
    return null;
  }

  const fabVisual = (
    <Animated.View
      collapsable={false}
      accessibilityRole="button"
      accessibilityLabel="더보기 메뉴. 길게 눌러 위치를 옮길 수 있습니다."
      style={[
        styles.fab,
        {
          width: DRAGGABLE_FAB_SIZE,
          height: DRAGGABLE_FAB_SIZE,
          borderRadius: DRAGGABLE_FAB_SIZE / 2,
        },
        animatedStyle,
      ]}
    >
      {Platform.OS === 'web' ? (
        <Pressable
          style={styles.fabInner}
          onPress={handleOpenMenu}
          accessibilityRole="button"
          accessibilityLabel="더보기 메뉴"
        >
          <AppIcon name="dots-horizontal" size={28} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View style={styles.fabInner} pointerEvents="none">
          <AppIcon name="dots-horizontal" size={28} color="#FFFFFF" />
        </View>
      )}
    </Animated.View>
  );

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      {Platform.OS === 'web' ? (
        fabVisual
      ) : (
        <GestureDetector gesture={gesture}>{fabVisual}</GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1100,
    elevation: 120,
  },
  fab: {
    position: 'absolute',
    ...APP_SHADOW.float,
  },
  fabInner: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: APP_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
