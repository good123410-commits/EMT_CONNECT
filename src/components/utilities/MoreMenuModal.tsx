import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_RADIUS } from '@/constants/appTheme';
import { UTILITY_TOOL_ITEMS } from '@/constants/utilityTools';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { UtilityToolRoute } from '@/constants/utilityTools';

type MoreMenuModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectTool: (route: UtilityToolRoute) => void;
  onOpenChemicalInfo: () => void;
};

const ICON_SIZE = 40;

const CHEMICAL_INFO_ITEM = {
  title: '약물정보찾기',
  icon: 'flask-outline' as const,
  accent: '#A78BFA',
  accentBg: '#2A2240',
};

export function MoreMenuModal({
  visible,
  onClose,
  onSelectTool,
  onOpenChemicalInfo,
}: MoreMenuModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemedColors();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
        <View
          className="bg-kemix-surface"
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: colors.surface,
            },
          ]}
        >
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>
        <View
          className="flex-row items-center justify-between px-5 py-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
        >
          <Text
            className="text-[17px] leading-6 text-kemix-text"
            style={{ fontFamily: 'Pretendard-Bold' }}
          >
            더보기 · 응급 유틸
          </Text>
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

        <ScrollView
          className="px-5 pt-3"
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="overflow-hidden"
            style={{
              borderRadius: APP_RADIUS.card,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Pressable
              className="flex-row items-center bg-kemix-surface active:opacity-90"
              style={{
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
              onPress={onOpenChemicalInfo}
            >
              <View
                className="items-center justify-center rounded-xl"
                style={{
                  width: ICON_SIZE,
                  height: ICON_SIZE,
                  backgroundColor: CHEMICAL_INFO_ITEM.accentBg,
                }}
              >
                <AppIcon name={CHEMICAL_INFO_ITEM.icon} size={20} color={CHEMICAL_INFO_ITEM.accent} />
              </View>
              <Text
                className="ml-3 flex-1 text-[15px] leading-5 text-kemix-text"
                style={{ fontFamily: 'Pretendard-SemiBold' }}
              >
                {CHEMICAL_INFO_ITEM.title}
              </Text>
              <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>

            {UTILITY_TOOL_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                className="flex-row items-center bg-kemix-surface active:opacity-90"
                style={{
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderBottomWidth: index < UTILITY_TOOL_ITEMS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                }}
                onPress={() => onSelectTool(item.route)}
              >
                <View
                  className="items-center justify-center rounded-xl"
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    backgroundColor: item.accentBg,
                  }}
                >
                  <AppIcon name={item.icon} size={20} color={item.accent} />
                </View>
                <Text
                  className="ml-3 flex-1 text-[15px] leading-5 text-kemix-text"
                  style={{ fontFamily: 'Pretendard-SemiBold' }}
                >
                  {item.title}
                </Text>
                <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <Text
            className="mt-4 text-center text-[11px] leading-5 text-kemix-text-muted"
            style={{ fontFamily: 'Pretendard' }}
          >
            의료 행위·처방을 대체하지 않는 참고용 도구입니다.
          </Text>
        </ScrollView>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '88%',
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
  },
});
