import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function MedicationWidgetGuideCard() {
  return (
    <View className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
      <View className="flex-row items-center">
        <Ionicons name="phone-portrait-outline" size={22} color="#0284c7" />
        <Text className="ml-2 text-base font-bold text-sky-900">홈 화면 위젯 설치 가이드</Text>
      </View>
      <Text className="mt-3 text-xs leading-5 text-sky-800">
        스마트폰 홈 화면에서 복용 타이머를 빠르게 확인할 수 있습니다. (네이티브 위젯은 추후 앱
        업데이트로 제공 예정)
      </Text>
      <View className="mt-3 rounded-xl border border-sky-100 bg-kemix-surface p-3">
        <Text className="text-xs font-bold text-kemix-text">iOS</Text>
        <Text className="mt-1 text-[11px] leading-4 text-kemix-text-secondary">
          1. 홈 화면 빈 공간을 길게 누르기 → 2. 좌측 상단 + 버튼 → 3. KEMIX 검색 → 4. 위젯 추가
        </Text>
        <Text className="mt-3 text-xs font-bold text-kemix-text">Android</Text>
        <Text className="mt-1 text-[11px] leading-4 text-kemix-text-secondary">
          1. 홈 화면 빈 공간 길게 누르기 → 2. 위젯 선택 → 3. KEMIX 복용 타이머 위젯 추가
        </Text>
      </View>
      <Text className="mt-3 text-[11px] leading-4 text-sky-700">
        현재는 앱 내 타이머·브라우저 알림으로 복용 시간을 알려줍니다. 백그라운드 푸시 알림은
        expo-notifications 연동 후 제공됩니다.
      </Text>
    </View>
  );
}
