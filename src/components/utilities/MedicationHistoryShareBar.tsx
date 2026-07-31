import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
import type { MedicationHistoryEntry, MedicationRegistration } from '@/types/medicationLog';
import {
  buildMedicationHistoryText,
  emailMedicationHistory,
  printMedicationHistory,
  shareMedicationHistoryText,
} from '@/utils/medicationHistoryShare';

type MedicationHistoryShareBarProps = {
  history: MedicationHistoryEntry[];
  registration: MedicationRegistration | null;
};

export function MedicationHistoryShareBar({
  history,
  registration,
}: MedicationHistoryShareBarProps) {
  const shareText = buildMedicationHistoryText(history, registration);

  const handleShare = async () => {
    try {
      await shareMedicationHistoryText(shareText);
    } catch {
      Alert.alert('공유 실패', '기록지를 공유할 수 없습니다.');
    }
  };

  const handleEmail = async () => {
    try {
      await emailMedicationHistory(shareText);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이메일 앱을 열 수 없습니다.';
      Alert.alert('이메일 공유 실패', message);
    }
  };

  const handlePrint = async () => {
    try {
      await printMedicationHistory(shareText);
    } catch (error) {
      const message = error instanceof Error ? error.message : '인쇄를 시작할 수 없습니다.';
      Alert.alert('인쇄 실패', message);
    }
  };

  return (
    <View className="mb-3 gap-2">
      <Text className="text-xs font-semibold text-kemix-text-secondary">기록지 공유</Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          className="flex-row items-center rounded-xl border border-kemix-border bg-kemix-bg px-3 py-2.5 active:bg-kemix-elevated"
          onPress={() => void handlePrint()}
        >
          <Ionicons name="print-outline" size={18} color="#475569" />
          <Text className="ml-1.5 text-xs font-semibold text-kemix-text">인쇄 / 출력</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center rounded-xl border border-kemix-border bg-kemix-bg px-3 py-2.5 active:bg-kemix-elevated"
          onPress={() => void handleShare()}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#475569" />
          <Text className="ml-1.5 text-xs font-semibold text-kemix-text">카카오톡 / 앱 공유</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center rounded-xl border border-kemix-border bg-kemix-bg px-3 py-2.5 active:bg-kemix-elevated"
          onPress={() => void handleEmail()}
        >
          <Ionicons name="mail-outline" size={18} color="#475569" />
          <Text className="ml-1.5 text-xs font-semibold text-kemix-text">이메일 공유</Text>
        </Pressable>
      </View>
    </View>
  );
}
