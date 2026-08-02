import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  addEmergencyLockScreenShortcut,
  promptEmergencyShortcutResult,
} from '@/services/emergencyShortcutService';
import { getEmergencyQuickViewUrl } from '@/utils/emergencyCardEncoding';

type EmergencyLockScreenGuideCardProps = {
  onTestQuickView: () => void;
};

export function EmergencyLockScreenGuideCard({
  onTestQuickView,
}: EmergencyLockScreenGuideCardProps) {
  const deepLink = getEmergencyQuickViewUrl();

  return (
    <View className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
      <View className="flex-row items-center">
        <Ionicons name="lock-closed-outline" size={22} color="#4338ca" />
        <Text className="ml-2 text-base font-bold text-indigo-900">
          스마트폰 잠금화면 숏컷(버튼) 설정하기
        </Text>
      </View>
      <Text className="mt-3 text-xs leading-5 text-indigo-800">
        잠금화면에서 한 번 터치로 응급 QR 카드와 비상 연락망을 열 수 있습니다. 아래 가이드를
        따라 KEMIX 응급 버튼을 등록하세요.
      </Text>

      <View className="mt-3 rounded-xl border border-indigo-100 bg-kemix-surface p-3">
        <View className="flex-row items-center">
          <Ionicons name="logo-apple" size={16} color="#334155" />
          <Text className="ml-1.5 text-xs font-bold text-kemix-text">iPhone (iOS)</Text>
        </View>
        <Text className="mt-2 text-[11px] leading-4 text-kemix-text-secondary">
          1. 잠금화면을 길게 누르기 → 2. 하단 「사용자화」 → 3. 잠금화면 선택 → 4. 「추가」
          또는 위젯 영역 탭 → 5. KEMIX 검색 후 「응급 카드」 위젯 추가 → 6. 완료
        </Text>
        <Text className="mt-2 text-[10px] leading-4 text-kemix-text-secondary">
          iOS 17+: 설정 → 배경화면 → 잠금화면 사용자화에서도 위젯을 추가할 수 있습니다.
        </Text>
      </View>

      <View className="mt-3 rounded-xl border border-indigo-100 bg-kemix-surface p-3">
        <View className="flex-row items-center">
          <Ionicons name="phone-portrait-outline" size={16} color="#334155" />
          <Text className="ml-1.5 text-xs font-bold text-kemix-text">갤럭시 (Android)</Text>
        </View>
        <Text className="mt-2 text-[11px] leading-4 text-kemix-text-secondary">
          1. 설정 → 잠금화면 → 2. 위젯 또는 바로가기(Shortcuts) → 3. KEMIX 응급 카드 선택 →
          4. 잠금화면에 추가 → 5. 잠금화면에서 버튼 터치 시 앱이 열리며 응급 카드가 표시됩니다
        </Text>
        <Text className="mt-2 text-[10px] leading-4 text-kemix-text-secondary">
          Galaxy: 설정 → 잠금화면 및 AOD → 잠금화면 편집 → 위젯/바로가기 영역에 KEMIX 추가
        </Text>
      </View>

      <View className="mt-3 rounded-lg bg-indigo-100/60 px-3 py-2">
        <Text className="text-[10px] font-semibold text-indigo-800">숏컷 딥링크 (개발·연동용)</Text>
        <Text className="mt-1 text-[10px] leading-4 text-indigo-700" selectable>
          {deepLink}
        </Text>
      </View>

      {Platform.OS === 'android' ? (
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-xl border border-indigo-300 bg-kemix-surface py-3.5 active:bg-indigo-50"
          onPress={() => {
            void addEmergencyLockScreenShortcut().then(promptEmergencyShortcutResult);
          }}
        >
          <Ionicons name="add-circle-outline" size={18} color="#4338ca" />
          <Text className="ml-2 text-sm font-bold text-indigo-900">홈/잠금화면 바로가기 추가</Text>
        </Pressable>
      ) : null}

      <Pressable
        className="mt-4 flex-row items-center justify-center rounded-xl bg-indigo-600 py-3.5 active:bg-indigo-700"
        onPress={onTestQuickView}
      >
        <Ionicons name="flash" size={18} color="#fff" />
        <Text className="ml-2 text-sm font-bold text-white">
          잠금화면 버튼 시뮬레이션 (Quick View 테스트)
        </Text>
      </Pressable>
      <Text className="mt-2 text-center text-[10px] text-indigo-600">
        탭하면 다른 화면을 거치지 않고 응급 카드가 전체 화면으로 열립니다.
      </Text>
    </View>
  );
}
