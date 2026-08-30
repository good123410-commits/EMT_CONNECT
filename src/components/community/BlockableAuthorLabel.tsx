import { Alert, Pressable, Text } from 'react-native';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { confirmBlockUser } from '@/utils/userBlockPrompt';

type BlockableAuthorLabelProps = {
  label: string;
  authorId?: string | null;
  className?: string;
  textClassName?: string;
  onBlocked?: () => void;
};

export function BlockableAuthorLabel({
  label,
  authorId,
  className,
  textClassName = 'text-xs font-bold',
  onBlocked,
}: BlockableAuthorLabelProps) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { blockAuthor, isSelf } = useBlockedUsers();

  const handlePress = () => {
    if (!user) {
      Alert.alert('로그인 필요', '유저 차단은 로그인 후 이용할 수 있습니다.');
      return;
    }
    if (isSelf(authorId)) {
      return;
    }

    confirmBlockUser({ authorId, anonymousLabel: label }, async (input) => {
      await blockAuthor(input);
      onBlocked?.();
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} 유저 차단`}
      className={className}
      hitSlop={6}
      onPress={handlePress}
    >
      <Text className={textClassName} style={{ color: colors.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}
