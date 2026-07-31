import { Text, View } from 'react-native';
import { APP_COLORS } from '@/constants/appTheme';

type EmptyStateProps = {
  message: string;
  hint?: string;
};

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <View className="items-center py-16">
      <Text
        className="text-kemix-body"
        style={{ fontFamily: 'Pretendard-Medium', color: APP_COLORS.textSecondary }}
      >
        {message}
      </Text>
      {hint ? (
        <Text
          className="mt-3 text-center text-kemix-caption"
          style={{ fontFamily: 'Pretendard', color: APP_COLORS.textMuted }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
