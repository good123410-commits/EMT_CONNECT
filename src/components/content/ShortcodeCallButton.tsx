import { useState } from 'react';
import { Pressable, ActivityIndicator, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_RADIUS } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { interceptEmergencyCall } from '@/utils/emergencySms';

type ShortcodeCallButtonProps = {
  phone?: string;
  label?: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function ShortcodeCallButton({ phone = '119', label }: ShortcodeCallButtonProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const dial = normalizePhone(phone) || '119';
  const title = label?.trim() || `응급 신고 ${dial}`;
  const displayName = profile?.name?.trim() || user?.user_metadata?.name?.trim() || null;

  const handlePress = () => {
    setLoading(true);
    void interceptEmergencyCall({
      phone: dial,
      userId: user?.id,
      displayName,
    }).finally(() => setLoading(false));
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} 긴급 신고`}
      onPress={() => void handlePress()}
      disabled={loading}
      className="my-4 overflow-hidden rounded-2xl active:opacity-90"
      style={{
        backgroundColor: '#DC2626',
        borderRadius: APP_RADIUS.card,
        opacity: loading ? 0.85 : 1,
      }}
    >
      <View className="flex-row items-center px-4 py-4">
        <View
          className="mr-3 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <AppIcon name="phone" size={22} color="#FFFFFF" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-white">{title}</Text>
          <Text className="mt-0.5 text-xs text-red-100">
            {loading ? '위치·의료정보 수집 중…' : '위치·의료정보 문자 자동 작성'}
          </Text>
        </View>
        <View className="rounded-full bg-kemix-surface px-3 py-1.5">
          <Text className="text-sm font-bold" style={{ color: '#DC2626' }}>
            {dial}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
