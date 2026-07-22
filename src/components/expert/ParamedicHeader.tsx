import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';

type ParamedicHeaderProps = {
  subtitle?: string;
};

export function ParamedicHeader({ subtitle }: ParamedicHeaderProps) {
  const { profile } = useAuth();
  const { isExpertMode, exitExpertMode } = useUserRole();

  return (
    <SafeAreaView edges={['top']} className="bg-[#14532d]">
      <View className="border-b border-green-800/60 px-4 pb-4 pt-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-green-400/20">
              <Text className="text-xl">🩺</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">{EMS_COMMUNITY_TAB_LABEL}</Text>
              <Text className="mt-0.5 text-xs text-green-300/80">
                {subtitle ?? `${profile?.name ?? '구조사'} · 미래회 소통 · 면허 인증 대원`}
              </Text>
            </View>
          </View>
          {isExpertMode ? (
            <Pressable
              onPress={exitExpertMode}
              hitSlop={12}
              className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-green-900/60"
            >
              <Ionicons name="log-out-outline" size={18} color="#86efac" />
            </Pressable>
          ) : null}
        </View>
        <View className="mt-3 flex-row items-center rounded-lg bg-green-400/10 px-3 py-2">
          <View className="mr-2 h-2 w-2 rounded-full bg-green-400" />
          <Text className="text-xs font-medium text-green-200">
            폐쇄형 전문가 커뮤니티 · 신고·익명화 정책 적용
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
