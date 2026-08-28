import { useEffect, useMemo, useState } from 'react';
import { Pressable, Dimensions, Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShortcodePickerBar } from '@/components/content/ShortcodePickerBar';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import type { ShortcodePickerAnchorRect } from '@/hooks/useShortcodePickerAnchor';
import type { ContentShortcode, ShortcodePickerMode } from '@/types/shortcode';

const POPUP_GAP = 8;

type ShortcodePickerOverlayProps = {
  visible: boolean;
  anchor: ShortcodePickerAnchorRect | null;
  mode: ShortcodePickerMode;
  items: ContentShortcode[];
  onSelect: (item: ContentShortcode) => void;
  onClose: () => void;
};

function resolvePopupFrame(anchor: ShortcodePickerAnchorRect, insetTop: number) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const horizontalInset = 8;
  const popupWidth = Math.min(anchor.width, screenWidth - horizontalInset * 2);
  const left = Math.max(
    horizontalInset,
    Math.min(anchor.x, screenWidth - popupWidth - horizontalInset),
  );
  const bottom = screenHeight - anchor.y + POPUP_GAP;
  const maxHeight = Math.max(132, anchor.y - insetTop - POPUP_GAP * 2);

  return { left, bottom, width: popupWidth, maxHeight };
}

export function ShortcodePickerOverlay({
  visible,
  anchor,
  mode,
  items,
  onSelect,
  onClose,
}: ShortcodePickerOverlayProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { lounge } = useEmsLoungeTheme();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      return;
    }

    const timer = setTimeout(() => setModalVisible(false), 160);
    return () => clearTimeout(timer);
  }, [visible]);

  const frame = useMemo(() => {
    if (!anchor) return null;
    return resolvePopupFrame(anchor, insets.top);
  }, [anchor, insets.top]);

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="숏코드 메뉴 닫기"
          onPress={onClose}
        />
        {visible && frame ? (
          <Animated.View
            entering={FadeInUp.duration(200)}
            exiting={FadeOutDown.duration(150)}
            style={[
              styles.popup,
              {
                left: frame.left,
                width: frame.width,
                bottom: frame.bottom,
                maxHeight: frame.maxHeight,
              },
            ]}
          >
            <ShortcodePickerBar
              visible
              variant="inline"
              mode={mode}
              items={items}
              onSelect={onSelect}
              onClose={onClose}
              borderColor={lounge.border}
              backgroundColor={lounge.surface}
              accentColor={lounge.accent}
              textColor={lounge.text}
              mutedColor={lounge.textMuted}
              fallbackBorderColor={colors.border}
              fallbackBackgroundColor={colors.surface}
              fallbackAccentColor={colors.blue}
              fallbackTextColor={colors.textPrimary}
              fallbackMutedColor={colors.textMuted}
            />
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  popup: {
    position: 'absolute',
    zIndex: 2,
  },
});
