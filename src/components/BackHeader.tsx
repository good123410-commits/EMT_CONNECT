import { Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_COLORS, APP_RADIUS } from '@/constants/appTheme';

type BackHeaderProps = {
  title: string;
  onBack: () => void;
};

export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <View className="mb-5 flex-row items-center">
      <Pressable
        className="mr-3 p-2"
        style={{
          borderRadius: APP_RADIUS.pill,
          backgroundColor: APP_COLORS.surfaceElevated,
          borderWidth: 1,
          borderColor: APP_COLORS.border,
        }}
        onPress={onBack}
        hitSlop={8}
      >
        <AppIcon name="arrow-left" size={22} color={APP_COLORS.textPrimary} />
      </Pressable>
      <Text
        className="flex-1 text-kemix-title"
        style={{ fontFamily: 'Pretendard-Bold', color: APP_COLORS.textPrimary }}
      >
        {title}
      </Text>
    </View>
  );
}
