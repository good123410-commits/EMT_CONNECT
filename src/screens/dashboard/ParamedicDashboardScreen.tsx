import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HiddenChannelPanel } from '@/components/channels/HiddenChannelPanel';
import { useAuth } from '@/contexts/AuthContext';

export function ParamedicDashboardScreen() {
  const { profile } = useAuth();

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-green-200 bg-green-900 px-4 pb-4">
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark" size={24} color="#86efac" />
          <Text className="ml-2 text-xl font-bold text-white">응급구조사 전용</Text>
        </View>
        <Text className="mt-1 text-sm text-green-200">
          {profile?.name ?? '구조사'} · 공통 라운지 & 응급구조사 소모임
        </Text>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4 pb-24">
        <View className="rounded-2xl border border-green-200 bg-white p-4">
          <Text className="text-base font-bold text-slate-900">현장 정보 허브</Text>
          <Text className="mt-2 text-sm text-slate-500">
            동료 구조사와 현장 정보, 장비 공유, 교대 일정 등이 이 영역에 연동됩니다.
          </Text>
        </View>

        <HiddenChannelPanel accentColor="#15803d" />
      </ScrollView>
    </View>
  );
}
