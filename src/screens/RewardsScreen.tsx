import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceQuizModule } from '@/components/rewards/AttendanceQuizModule';
import { ProVerificationPanel } from '@/components/rewards/ProVerificationPanel';
import { AccountBar } from '@/components/rewards/AccountBar';
import { PointFeedbackToast, WalletHeader } from '@/components/rewards/WalletHeader';

export function RewardsScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="text-xl font-bold text-slate-900">리워드</Text>
        <Text className="mb-3 text-sm text-slate-500">출석 · 퀴즈 · 포인트 적립</Text>
        <AccountBar />
        <View className="mt-3">
          <WalletHeader />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-32 gap-4">
        <AttendanceQuizModule />
        <ProVerificationPanel />
      </ScrollView>

      <PointFeedbackToast />
    </View>
  );
}
