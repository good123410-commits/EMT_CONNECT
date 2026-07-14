import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';

type PrivateEmsHeaderProps = {
  subtitle?: string;
};

export function PrivateEmsHeader({ subtitle }: PrivateEmsHeaderProps) {
  const { profile } = useAuth();
  const { exitExpertMode } = useUserRole();

  return (
    <SafeAreaView edges={['top']} className="bg-[#0f172a]">
      <View className="border-b border-slate-700/60 px-4 pb-4 pt-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-red-600/20">
              <Text className="text-xl">🚑</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">사설 구급차 관제 센터</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                {subtitle ?? `${profile?.company_name ?? profile?.name ?? '운용사'} · 실시간 관제`}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={exitExpertMode}
            hitSlop={12}
            className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-slate-800"
          >
            <Ionicons name="log-out-outline" size={18} color="#94a3b8" />
          </Pressable>
        </View>
        <View className="mt-3 flex-row items-center rounded-lg bg-emerald-500/10 px-3 py-2">
          <View className="mr-2 h-2 w-2 rounded-full bg-emerald-400" />
          <Text className="text-xs font-medium text-emerald-300">실시간 콜센터 연결됨 · 배차 대기 중</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
