import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceQuizModule } from '@/components/rewards/AttendanceQuizModule';
import { ProModeTestButton } from '@/components/rewards/ProModeTestButton';
import { ProVerificationPanel } from '@/components/rewards/ProVerificationPanel';
import { AccountBar } from '@/components/rewards/AccountBar';
import { ShopModule } from '@/components/rewards/ShopModule';
import { SurveyModule } from '@/components/rewards/SurveyModule';
import { PointFeedbackToast, WalletHeader } from '@/components/rewards/WalletHeader';
import { SegmentControl } from '@/components/SegmentControl';

type RewardTab = 'attendance' | 'survey' | 'shop';

export function RewardsScreen() {
  const [tab, setTab] = useState<RewardTab>('attendance');

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="text-xl font-bold text-slate-900">리워드</Text>
        <Text className="mb-3 text-sm text-slate-500">출석 · 퀴즈 · 설문 · 포인트몰</Text>
        <AccountBar />
        <View className="mt-3">
          <WalletHeader />
        </View>
        <View className="mt-3">
          <SegmentControl
            options={[
              { value: 'attendance', label: '출석·퀴즈' },
              { value: 'survey', label: '설문' },
              { value: 'shop', label: '포인트몰' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-32 gap-4">
        {tab === 'attendance' ? <AttendanceQuizModule /> : null}
        {tab === 'survey' ? <SurveyModule /> : null}
        {tab === 'shop' ? <ShopModule /> : null}
        <ProVerificationPanel />
        {__DEV__ ? <ProModeTestButton /> : null}
      </ScrollView>

      <PointFeedbackToast />
    </View>
  );
}
