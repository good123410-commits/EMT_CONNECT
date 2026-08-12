import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { PersonalMedicalProfileSection } from '@/components/utilities/PersonalMedicalProfileSection';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';
import { useAuth } from '@/contexts/AuthContext';
import { interceptEmergencyCall } from '@/utils/emergencySms';

type EmergencyAction = {
  phone: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const EMERGENCY_ACTIONS: EmergencyAction[] = [
  {
    phone: '119',
    label: '119 응급 신고',
    subtitle: '위치·의료정보·비상연락망 문자 전송',
    icon: 'medical',
  },
  {
    phone: '112',
    label: '112 경찰 신고',
    subtitle: '위치·의료정보·비상연락망 문자 전송',
    icon: 'shield',
  },
];

export function EmergencyResponseScreen() {
  const { user, profile } = useAuth();
  const [loadingPhone, setLoadingPhone] = useState<string | null>(null);

  const displayName = profile?.name?.trim() || user?.user_metadata?.name?.trim() || null;

  const handleEmergencyPress = (phone: string) => {
    setLoadingPhone(phone);
    void interceptEmergencyCall({
      phone,
      userId: user?.id,
      displayName,
    }).finally(() => {
      setLoadingPhone(null);
    });
  };

  return (
    <UtilityToolShell>
      <View className="mb-5">
        <Text className="text-lg font-bold text-kemix-text">개인 의료정보 및 비상연락망</Text>
        <Text className="mt-1 text-sm leading-5 text-kemix-text-secondary">
          긴급 신고 시 자동으로 전달될 정보를 미리 입력해 두세요.
        </Text>
      </View>

      <PersonalMedicalProfileSection userId={user?.id} />

      <View className="my-6 h-px bg-kemix-border" />

      <View className="mb-4">
        <Text className="text-lg font-bold text-kemix-text">긴급 신고</Text>
        <Text className="mt-1 text-sm leading-5 text-kemix-text-secondary">
          버튼을 누르면 확인 창이 뜨고, &apos;예&apos; 선택 시 GPS 위치와 저장된 의료정보가 담긴
          문자 작성 화면이 열립니다. 앱 어디에서든 119·112를 눌러도 동일하게 동작합니다.
        </Text>
      </View>

      <View className="gap-3">
        {EMERGENCY_ACTIONS.map((action) => {
          const loading = loadingPhone === action.phone;
          return (
            <Pressable
              key={action.phone}
              className="overflow-hidden rounded-2xl bg-red-600 active:bg-red-700"
              disabled={loadingPhone !== null}
              onPress={() => handleEmergencyPress(action.phone)}
            >
              <View className="flex-row items-center px-4 py-4">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name={action.icon} size={22} color="#fff" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-white">{action.label}</Text>
                  <Text className="mt-0.5 text-xs text-red-100">{action.subtitle}</Text>
                </View>
                <View className="rounded-full bg-white px-3 py-1.5">
                  <Text className="text-sm font-bold text-red-600">{action.phone}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </UtilityToolShell>
  );
}
