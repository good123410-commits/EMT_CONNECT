import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HiddenChannelPanel } from '@/components/channels/HiddenChannelPanel';
import { useAuth } from '@/contexts/AuthContext';

export function HospitalDashboardScreen() {
  const { profile } = useAuth();

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-blue-200 bg-blue-900 px-4 pb-4">
        <View className="flex-row items-center">
          <Ionicons name="medical" size={24} color="#93c5fd" />
          <Text className="ml-2 text-xl font-bold text-white">병원 관계자 대시보드</Text>
        </View>
        <Text className="mt-1 text-sm text-blue-200">
          {profile?.company_name ?? profile?.name ?? '병원'} · 간이 관제 시스템
        </Text>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4 pb-24">
        <View className="rounded-2xl border border-blue-200 bg-white p-4">
          <Text className="text-base font-bold text-slate-900">간이 관제 현황</Text>
          <Text className="mt-2 text-sm text-slate-500">
            응급실 가용 병상, 이송 환자 현황, 사설 구급차 연동 상태 등이 이 영역에 표시됩니다.
          </Text>
          <View className="mt-4 flex-row gap-3">
            {[
              { label: '가용 병상', value: '--' },
              { label: '이송 대기', value: '--' },
              { label: '연동 EMS', value: '--' },
            ].map((stat) => (
              <View key={stat.label} className="flex-1 rounded-xl bg-blue-50 p-3">
                <Text className="text-xs text-blue-600">{stat.label}</Text>
                <Text className="mt-1 text-lg font-bold text-blue-900">{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <HiddenChannelPanel accentColor="#1d4ed8" />
      </ScrollView>
    </View>
  );
}
