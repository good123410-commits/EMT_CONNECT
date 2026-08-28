import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ContentShortcode, ShortcodePickerMode } from '@/types/shortcode';

type ShortcodePickerBarProps = {
  visible: boolean;
  variant?: 'sheet' | 'inline';
  mode?: ShortcodePickerMode;
  items: ContentShortcode[];
  onSelect: (item: ContentShortcode) => void;
  onClose: () => void;
  borderColor: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  fallbackBorderColor?: string;
  fallbackBackgroundColor?: string;
  fallbackAccentColor?: string;
  fallbackTextColor?: string;
  fallbackMutedColor?: string;
};

function actionLabel(actionType: ContentShortcode['action_type']): string {
  switch (actionType) {
    case 'call_button':
      return '전화';
    case 'ad_banner':
      return '배너';
    case 'template':
      return '양식';
    default: {
      const _exhaustive: never = actionType;
      return _exhaustive;
    }
  }
}

function modeLabel(mode: ShortcodePickerMode): string {
  return mode === 'admin' ? '관리자 전체 메뉴' : '일반 숏코드';
}

export function ShortcodePickerBar({
  visible,
  variant = 'sheet',
  mode = 'user',
  items,
  onSelect,
  onClose,
  borderColor,
  backgroundColor,
  accentColor,
  textColor,
  mutedColor,
  fallbackBorderColor,
  fallbackBackgroundColor,
  fallbackAccentColor,
  fallbackTextColor,
  fallbackMutedColor,
}: ShortcodePickerBarProps) {
  if (!visible) return null;

  const resolvedBorderColor = borderColor || fallbackBorderColor || '#e2e8f0';
  const resolvedBackgroundColor = backgroundColor || fallbackBackgroundColor || '#ffffff';
  const resolvedAccentColor = accentColor || fallbackAccentColor || '#2563eb';
  const resolvedTextColor = textColor || fallbackTextColor || '#0f172a';
  const resolvedMutedColor = mutedColor || fallbackMutedColor || '#64748b';
  const isInline = variant === 'inline';

  return (
    <View
      style={{
        borderWidth: isInline ? 1 : 0,
        borderTopWidth: 1,
        borderColor: resolvedBorderColor,
        backgroundColor: resolvedBackgroundColor,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: isInline ? 14 : 0,
        borderTopLeftRadius: isInline ? 14 : 16,
        borderTopRightRadius: isInline ? 14 : 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: isInline ? 4 : -2 },
        shadowOpacity: isInline ? 0.14 : 0.12,
        shadowRadius: isInline ? 12 : 8,
        elevation: 12,
        overflow: 'hidden',
      }}
    >
      <View className="mb-2 flex-row items-center justify-between px-3">
        <View>
          <Text className="text-xs font-bold" style={{ color: resolvedTextColor }}>
            숏코드 삽입
          </Text>
          <Text className="mt-0.5 text-[10px]" style={{ color: resolvedMutedColor }}>
            {modeLabel(mode)}
          </Text>
        </View>
        <Pressable hitSlop={8} onPress={onClose} accessibilityRole="button" accessibilityLabel="숏코드 메뉴 닫기">
          <Ionicons name="close" size={18} color={resolvedMutedColor} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {items.length === 0 ? (
          <View className="rounded-xl border px-4 py-3" style={{ borderColor: resolvedBorderColor }}>
            <Text className="text-xs" style={{ color: resolvedMutedColor }}>
              사용 가능한 숏코드가 없습니다.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title} 삽입`}
              onPress={() => onSelect(item)}
              className="active:opacity-90"
              style={{
                minWidth: 132,
                maxWidth: 180,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: resolvedBorderColor,
                backgroundColor: resolvedBackgroundColor,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-[10px] font-bold uppercase" style={{ color: resolvedAccentColor }}>
                  {actionLabel(item.action_type)}
                </Text>
                <Text className="text-[10px] font-semibold" style={{ color: resolvedMutedColor }}>
                  {item.target_role === 'admin' ? '관리자' : '전체'}
                </Text>
              </View>
              <Text className="text-sm font-bold" style={{ color: resolvedTextColor }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="mt-1 text-[11px]" style={{ color: resolvedMutedColor }} numberOfLines={1}>
                {item.shortcut}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
