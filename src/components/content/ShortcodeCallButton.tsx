import { Linking, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_COLORS, APP_RADIUS } from '@/constants/appTheme';

type ShortcodeCallButtonProps = {
  phone?: string;
  label?: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function ShortcodeCallButton({ phone = '119', label }: ShortcodeCallButtonProps) {
  const dial = normalizePhone(phone) || '119';
  const title = label?.trim() || `응급 신고 ${dial}`;

  const handlePress = () => {
    void Linking.openURL(`tel:${dial}`).catch(() => undefined);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} 전화 연결`}
      onPress={handlePress}
      className="my-4 overflow-hidden rounded-2xl active:opacity-90"
      style={{
        backgroundColor: '#DC2626',
        borderRadius: APP_RADIUS.card,
      }}
    >
      <View className="flex-row items-center px-4 py-4">
        <View
          className="mr-3 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          <AppIcon name="phone" size={22} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-white">{title}</Text>
          <Text className="mt-0.5 text-xs text-red-100">탭하면 즉시 전화 앱으로 연결됩니다</Text>
        </View>
        <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: APP_COLORS.surface }}>
          <Text className="text-sm font-bold" style={{ color: '#DC2626' }}>
            {dial}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
