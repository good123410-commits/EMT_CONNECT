import {
  Platform,
  Pressable,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigationHeaderHeight } from '@/components/navigation/AppNavigationHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import {
  SettingsAttachedModals,
  SettingsScreenProvider,
  SettingsScrollBody,
} from '@/components/settings/settingsScreenModel';
import { APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialAction?: string;
};

/** KON 글로벌 헤더 바로 아래에서 시트 시작 */
const SHEET_TOP_GAP = 8;

export function SettingsBottomSheetModal({ visible, onClose, initialAction }: Props) {
  const insets = useSafeAreaInsets();
  const appHeaderHeight = useAppNavigationHeaderHeight();
  const { colors } = useThemedColors();
  const bottomInset = Math.max(insets.bottom, 12);
  const sheetTop = appHeaderHeight + SHEET_TOP_GAP;

  if (!visible) {
    return null;
  }

  return (
    <SettingsScreenProvider initialAction={initialAction}>
      <Modal
        visible
        animationType="slide"
        transparent
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityLabel="닫기"
          />
          <View
            style={[
              styles.sheet,
              {
                marginTop: sheetTop,
                paddingBottom: bottomInset,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={[styles.sheetChrome, { backgroundColor: colors.surface }]}>
              <View
                className="flex-row items-center justify-between px-5 py-3"
                style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
              >
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>설정</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                  className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
                  style={{ backgroundColor: colors.blueLight }}
                  onPress={onClose}
                  hitSlop={8}
                >
                  <AppIcon name="close" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.sheetBody}>
              <SettingsScrollBody embedded />
            </View>
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
    width: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 0,
    elevation: 0,
  },
  sheet: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    borderTopLeftRadius: APP_RADIUS.cardLg,
    borderTopRightRadius: APP_RADIUS.cardLg,
    overflow: 'hidden',
    flexDirection: 'column',
    zIndex: 1,
    elevation: Platform.OS === 'android' ? 24 : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      default: {},
    }),
  },
  sheetChrome: {
    flexShrink: 0,
  },
  sheetBody: {
    flex: 1,
    minHeight: 0,
  },
  sheetTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 17,
    lineHeight: 24,
  },
});
