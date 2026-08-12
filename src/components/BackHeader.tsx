import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

type BackHeaderProps = {
  title: string;
  onBack: () => void;
};

export function BackHeader({ title, onBack }: BackHeaderProps) {
  const { colors } = useThemedColors();

  return (
    <View className="mb-5 flex-row items-center">
      <Pressable
        className="mr-3 bg-kemix-surface-elevated p-2"
        style={{
          borderRadius: APP_RADIUS.pill,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        onPress={onBack}
        hitSlop={8}
      >
        <AppIcon name="arrow-left" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text
        className="flex-1 text-kemix-title text-kemix-text"
        style={{ fontFamily: 'Pretendard-Bold' }}
      >
        {title}
      </Text>
    </View>
  );
}
