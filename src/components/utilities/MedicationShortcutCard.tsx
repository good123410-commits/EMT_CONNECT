import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS, APP_RADIUS } from '@/constants/appTheme';
import {
  addMedicationTimerShortcut,
  openMedicationWidgetGuide,
} from '@/services/medicationShortcutService';

type MedicationShortcutGuideModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function MedicationShortcutGuideModal({ visible, onClose }: MedicationShortcutGuideModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/45" onPress={onClose}>
        <View className="flex-1" />
      </Pressable>

      <View
        style={{
          borderTopLeftRadius: APP_RADIUS.cardLg,
          borderTopRightRadius: APP_RADIUS.cardLg,
          backgroundColor: APP_COLORS.surface,
          paddingBottom: Math.max(insets.bottom, 16),
          maxHeight: '80%',
        }}
      >
        <View className="flex-row items-center justify-between border-b border-kemix-border-light px-5 py-4">
          <Text className="text-base font-bold text-kemix-text">홈 화면 위젯 · 바로가기</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView className="px-5 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="mb-3 text-xs leading-5 text-kemix-text-secondary">
            홈 화면에서 약물 타이머에 바로 접근할 수 있습니다.
          </Text>

          <View className="mb-3 rounded-xl border border-sky-100 bg-sky-50 p-3">
            <Text className="text-xs font-bold text-kemix-text">Android · 바로가기</Text>
            <Text className="mt-2 text-[11px] leading-4 text-kemix-text-secondary">
              1. 상단 「홈 화면 바로가기 추가」 버튼 탭{'\n'}
              2. 시스템 확인 창에서 「추가」 선택{'\n'}
              3. 홈 화면 아이콘 탭 → 약물 타이머 즉시 실행
            </Text>
            <Text className="mt-3 text-xs font-bold text-kemix-text">Android · 위젯</Text>
            <Text className="mt-1 text-[11px] leading-4 text-kemix-text-secondary">
              홈 화면 길게 누르기 → 위젯 → KEMIX 검색 → 복용 타이머 추가
            </Text>
          </View>

          <View className="mb-4 rounded-xl border border-kemix-border bg-kemix-bg p-3">
            <Text className="text-xs font-bold text-kemix-text">iPhone (iOS)</Text>
            <Text className="mt-2 text-[11px] leading-4 text-kemix-text-secondary">
              1. 홈 화면 빈 공간 길게 누르기{'\n'}
              2. 좌측 상단 ＋ 버튼{'\n'}
              3. KEMIX 검색 → 위젯 추가
            </Text>
          </View>

          <Pressable
            className="mb-2 flex-row items-center justify-center rounded-xl border border-sky-200 bg-sky-50 py-3 active:bg-sky-100"
            onPress={() => void openMedicationWidgetGuide()}
          >
            <Ionicons name="phone-portrait-outline" size={18} color="#0284c7" />
            <Text className="ml-2 text-sm font-semibold text-sky-800">홈 화면으로 이동</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function MedicationShortcutCard() {
  const [loading, setLoading] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const handleAddShortcut = async () => {
    setLoading(true);
    try {
      const result = await addMedicationTimerShortcut();
      if (result.action === 'guide') {
        setGuideVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <View className="flex-row items-center">
          <Ionicons name="apps-outline" size={22} color="#0284c7" />
          <Text className="ml-2 text-base font-bold text-sky-900">홈 화면 바로가기 · 위젯</Text>
        </View>
        <Text className="mt-2 text-xs leading-5 text-sky-800">
          {Platform.OS === 'android'
            ? '버튼 한 번으로 홈 화면에 「약물 타이머」 아이콘을 추가하고 즉시 실행할 수 있습니다.'
            : '홈 화면 위젯 추가 방법을 안내합니다.'}
        </Text>

        <Pressable
          className={`mt-3 flex-row items-center justify-center rounded-xl py-3.5 ${
            loading ? 'bg-sky-300' : 'bg-sky-600 active:bg-sky-700'
          }`}
          disabled={loading}
          onPress={() => void handleAddShortcut()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text className="ml-2 text-sm font-bold text-white">홈 화면 바로가기 추가</Text>
            </>
          )}
        </Pressable>

        <Pressable
          className="mt-2 flex-row items-center justify-center rounded-xl border border-sky-200 bg-kemix-surface py-3 active:bg-sky-50"
          onPress={() => setGuideVisible(true)}
        >
          <Ionicons name="help-circle-outline" size={18} color="#0284c7" />
          <Text className="ml-1.5 text-sm font-semibold text-sky-800">위젯 추가 안내</Text>
        </Pressable>
      </View>

      <MedicationShortcutGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </>
  );
}
