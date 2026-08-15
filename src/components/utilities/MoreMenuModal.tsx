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

const ICON_SIZE = 44;

const CHEMICAL_INFO_ITEM = {
  title: '약물정보찾기',
  subtitle: '성분·효능·주의사항을 빠르게 검색',
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
          className="px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="mb-2 text-[12px] uppercase tracking-wide text-kemix-text-muted"
            style={{ fontFamily: 'Pretendard-SemiBold' }}
          >
            자주 찾는 정보
          </Text>

          <Pressable
            className="mb-5 flex-row items-center rounded-2xl active:opacity-90"
            style={{
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: CHEMICAL_INFO_ITEM.accentBg,
              borderWidth: 1,
              borderColor: `${CHEMICAL_INFO_ITEM.accent}33`,
            }}
            onPress={onOpenChemicalInfo}
          >
            <View
              className="items-center justify-center rounded-xl"
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <AppIcon name={CHEMICAL_INFO_ITEM.icon} size={22} color={CHEMICAL_INFO_ITEM.accent} />
            </View>
            <View className="ml-3.5 flex-1">
              <Text
                className="text-[16px] leading-5 text-kemix-text"
                style={{ fontFamily: 'Pretendard-Bold', color: '#F8FAFC' }}
              >
                {CHEMICAL_INFO_ITEM.title}
              </Text>
              <Text
                className="mt-1 text-[12px] leading-4"
                style={{ fontFamily: 'Pretendard', color: '#C4B5FD' }}
              >
                {CHEMICAL_INFO_ITEM.subtitle}
              </Text>
            </View>
            <AppIcon name="chevron-forward" size={20} color={CHEMICAL_INFO_ITEM.accent} />
          </Pressable>

          <Text
            className="mb-2 text-[12px] uppercase tracking-wide text-kemix-text-muted"
            style={{ fontFamily: 'Pretendard-SemiBold' }}
          >
            응급 참고 도구
          </Text>

          <View
            className="overflow-hidden"
            style={{
              borderRadius: APP_RADIUS.card,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            {UTILITY_TOOL_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                className="flex-row items-center bg-kemix-surface active:opacity-90"
                style={{
                  paddingVertical: 14,
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
                  <AppIcon name={item.icon} size={22} color={item.accent} />
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
