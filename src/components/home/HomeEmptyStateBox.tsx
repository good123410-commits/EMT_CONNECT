import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

type HomeEmptyStateBoxProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function HomeEmptyStateBox({
  message,
  icon = 'albums-outline',
}: HomeEmptyStateBoxProps) {
  const { colors } = useThemedColors();

  return (
    <View
      className="items-center justify-center border border-dashed px-4 py-8"
      style={{
        borderColor: colors.border,
        borderRadius: APP_RADIUS.md,
        backgroundColor: colors.surface,
      }}
    >
      <Ionicons name={icon} size={28} color={colors.textMuted} />
      <Text
        className="mt-2 text-center text-kemix-text-secondary"
        style={{ fontFamily: APP_FONT.regular, fontSize: 13, lineHeight: 18 }}
      >
        {message}
      </Text>
    </View>
  );
}
