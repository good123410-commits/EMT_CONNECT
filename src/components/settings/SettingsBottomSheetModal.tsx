import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { SettingsContent } from '@/components/settings/SettingsContent';
import { APP_COLORS, APP_RADIUS } from '@/constants/appTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsBottomSheetModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = windowHeight * 0.88;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
        <View
          className="bg-kemix-surface"
          style={[
            styles.sheet,
            {
              maxHeight: sheetMaxHeight,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <Pressable onPress={onClose} accessibilityLabel="설정 닫기">
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
          </Pressable>

          <View
            className="flex-row items-center justify-between px-5 py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: APP_COLORS.borderLight }}
          >
            <Text
              className="text-[17px] leading-6"
              style={{ fontFamily: 'Pretendard-Bold', color: APP_COLORS.navy }}
            >
              설정
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
              style={{ backgroundColor: APP_COLORS.blueLight }}
              onPress={onClose}
              hitSlop={8}
            >
              <AppIcon name="close" size={18} color={APP_COLORS.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <SettingsContent embedded onRequestClose={onClose} />
          </View>        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: APP_RADIUS.cardLg,
    borderTopRightRadius: APP_RADIUS.cardLg,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: APP_COLORS.border,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});
