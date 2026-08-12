import { Text, View } from 'react-native';
import { useThemedColors } from '@/hooks/useThemedColors';

type EmptyStateProps = {
  message: string;
  hint?: string;
};

export function EmptyState({ message, hint }: EmptyStateProps) {
  const { colors } = useThemedColors();

  return (
    <View className="items-center py-16">
      <Text
        className="text-kemix-body"
        style={{ fontFamily: 'Pretendard-Medium', color: colors.textSecondary }}
      >
        {message}
      </Text>
      {hint ? (
        <Text
          className="mt-3 text-center text-kemix-caption"
          style={{ fontFamily: 'Pretendard', color: colors.textMuted }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
