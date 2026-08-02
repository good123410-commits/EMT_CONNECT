import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import {
  SettingsAttachedModals,
  SettingsScreenProvider,
  SettingsScrollBody,
} from '@/components/settings/settingsScreenModel';
import { APP_COLORS, APP_RADIUS } from '@/constants/appTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsBottomSheetModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.88;
  const bottomInset = Math.max(insets.bottom, 12);

  if (!visible) {
    return null;
  }

  return (
    <SettingsScreenProvider>
      <Modal visible animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
          <View
            className="bg-kemix-surface"
            style={[
              styles.sheet,
              {
                height: sheetHeight,
                maxHeight: sheetHeight,
                paddingBottom: bottomInset,
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
              <Text style={styles.sheetTitle}>설정</Text>
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

            <SettingsScrollBody embedded />
          </View>
        </View>
      </Modal>
      <SettingsAttachedModals />
    </SettingsScreenProvider>
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
    width: '100%',
    borderTopLeftRadius: APP_RADIUS.cardLg,
    borderTopRightRadius: APP_RADIUS.cardLg,
    overflow: 'hidden',
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
  sheetTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 17,
    lineHeight: 24,
    color: APP_COLORS.navy,
  },
});
