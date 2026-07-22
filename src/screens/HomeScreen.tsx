import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuideAdminCodeModal } from '@/components/guides/GuideAdminCodeModal';
import { KemiGuideSection } from '@/components/guides/KemiGuideSection';

const ADMIN_CODE_TAP_WINDOW_MS = 900;

export function HomeScreen() {
  const [adminCodeModalVisible, setAdminCodeModalVisible] = useState(false);
  const adminTapCountRef = useRef(0);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHeaderSecretTap = () => {
    adminTapCountRef.current += 1;

    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
    adminTapTimerRef.current = setTimeout(() => {
      adminTapCountRef.current = 0;
    }, ADMIN_CODE_TAP_WINDOW_MS);

    if (adminTapCountRef.current >= 3) {
      adminTapCountRef.current = 0;
      if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
      setAdminCodeModalVisible(true);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Pressable onPress={handleHeaderSecretTap}>
          <Text className="mb-1 text-xl font-bold text-slate-900">생활 응급처치 가이드</Text>
          <Text className="text-sm text-slate-500">웹·앱 실시간 연동 · 일상 속 응급상황 대처법</Text>
        </Pressable>
      </SafeAreaView>

      <KemiGuideSection />

      <GuideAdminCodeModal
        visible={adminCodeModalVisible}
        onClose={() => setAdminCodeModalVisible(false)}
      />
    </View>
  );
}
