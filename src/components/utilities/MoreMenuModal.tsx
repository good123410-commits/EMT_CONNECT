import { Pressable, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { APP_RADIUS } from '@/constants/appTheme';
import { UTILITY_TOOL_ITEMS } from '@/constants/utilityTools';
import { useThemedColors } from '@/hooks/useThemedColors';
import { CHEMICAL_BOOKMARK, createUtilityToolBookmark } from '@/utils/bookmarkItems';
import type { UtilityToolRoute } from '@/constants/utilityTools';
import type { BookmarkInput } from '@/types/bookmark';

type MoreMenuModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectTool: (route: UtilityToolRoute) => void;
  onOpenChemicalInfo: () => void;
};

const ICON_SIZE = 44;

type EmergencyReferenceTool = {
  id: string;
  bookmark: BookmarkInput;
  title: string;
  subtitle?: string;
  icon: AppIconName;
  accent: string;
  accentBg: string;
  onPress: () => void;
};

type MoreMenuRowProps = {
  item: EmergencyReferenceTool;
  showDivider?: boolean;
};

function MoreMenuRow({ item, showDivider = false }: MoreMenuRowProps) {
  const { colors } = useThemedColors();

  return (
    <View>
      <View className="flex-row items-center bg-kemix-surface" style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
        <Pressable
          className="min-w-0 flex-1 flex-row items-center active:opacity-90"
          onPress={item.onPress}
          accessibilityRole="button"
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
          <View className="ml-3 min-w-0 flex-1">
            <Text
              className="text-[15px] leading-5 text-kemix-text"
              style={{
                fontFamily: 'Pretendard-SemiBold',
                color: colors.textPrimary,
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text
                className="mt-1 text-[12px] leading-4"
                style={{
                  fontFamily: 'Pretendard',
                  color: colors.textSecondary,
                }}
                numberOfLines={2}
              >
                {item.subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <BookmarkButton item={item.bookmark} size={20} style={{ marginHorizontal: 8 }} />
        <AppIcon name="chevron-right" size={18} color={colors.textMuted} />
      </View>
      {showDivider ? (
        <View style={{ height: 1, backgroundColor: colors.borderLight }} />
      ) : null}
    </View>
  );
}

function buildEmergencyReferenceTools(
  onOpenChemicalInfo: () => void,
  onSelectTool: (route: UtilityToolRoute) => void,
): EmergencyReferenceTool[] {
  return [
    {
      id: 'chemical',
      bookmark: CHEMICAL_BOOKMARK,
      title: CHEMICAL_BOOKMARK.title,
      subtitle: '성분·효능·주의사항을 빠르게 검색',
      icon: CHEMICAL_BOOKMARK.icon,
      accent: CHEMICAL_BOOKMARK.iconColor,
      accentBg: CHEMICAL_BOOKMARK.iconBg,
      onPress: onOpenChemicalInfo,
    },
    ...UTILITY_TOOL_ITEMS.map((tool) => ({
      id: tool.id,
      bookmark: createUtilityToolBookmark(tool),
      title: tool.title,
      icon: tool.icon as AppIconName,
      accent: tool.accent,
      accentBg: tool.accentBg,
      onPress: () => onSelectTool(tool.route),
    })),
  ];
}

export function MoreMenuModal({
  visible,
  onClose,
  onSelectTool,
  onOpenChemicalInfo,
}: MoreMenuModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemedColors();
  const emergencyReferenceTools = buildEmergencyReferenceTools(onOpenChemicalInfo, onSelectTool);

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
            {emergencyReferenceTools.map((item, index) => (
              <MoreMenuRow
                key={item.id}
                item={item}
                showDivider={index < emergencyReferenceTools.length - 1}
              />
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
