import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

type HomeEmptyStateBoxProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  iconAccessibilityLabel?: string;
};

export function HomeEmptyStateBox({
  message,
  icon = 'albums-outline',
  onIconPress,
  iconAccessibilityLabel,
}: HomeEmptyStateBoxProps) {
  const { colors } = useThemedColors();

  const iconNode = (
    <Ionicons name={icon} size={28} color={colors.textMuted} />
  );

  return (
    <View
      className="items-center justify-center border border-dashed px-4 py-8"
      style={{
        borderColor: colors.border,
        borderRadius: APP_RADIUS.md,
        backgroundColor: colors.surface,
      }}
    >
      {onIconPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={iconAccessibilityLabel ?? '메뉴로 이동'}
          className="active:opacity-70"
          hitSlop={12}
          onPress={onIconPress}
        >
          {iconNode}
        </Pressable>
      ) : (
        iconNode
      )}
      <Text
        className="mt-2 text-center text-kemix-text-secondary"
        style={{ fontFamily: APP_FONT.regular, fontSize: 13, lineHeight: 18 }}
      >
        {message}
      </Text>
    </View>
  );
}
