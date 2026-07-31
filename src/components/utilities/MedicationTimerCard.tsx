import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import {
  formatCountdown,
  formatHistoryTime,
  getRemainingMs,
} from '@/utils/medicationTimer';
import type { MedicationDrugSlot } from '@/types/medicationLog';

type MedicationTimerCardProps = {
  label: string;
  slot: MedicationDrugSlot;
  nowMs: number;
  accent?: 'violet' | 'amber';
};

export function MedicationTimerCard({
  label,
  slot,
  nowMs,
  accent = 'violet',
}: MedicationTimerCardProps) {
  const remainingMs = getRemainingMs(slot.nextDueAt, nowMs);
  const timerLabel =
    remainingMs === null
      ? '복용 완료 후 타이머가 시작됩니다'
      : remainingMs > 0
        ? formatCountdown(remainingMs)
        : '복용 시간입니다';

  const border = accent === 'amber' ? 'border-amber-200' : 'border-violet-200';
  const bg = accent === 'amber' ? 'bg-amber-50' : 'bg-violet-50';
  const titleColor = accent === 'amber' ? 'text-amber-700' : 'text-violet-700';
  const timeColor = accent === 'amber' ? 'text-amber-900' : 'text-violet-900';
  const subColor = accent === 'amber' ? 'text-amber-600' : 'text-violet-600';

  return (
    <View className={`mt-3 items-center rounded-2xl border ${border} ${bg} px-4 py-5`}>
      <Text className={`text-xs font-semibold ${titleColor}`}>{label}</Text>
      {slot.drugName ? (
        <Text className="mt-1 text-sm font-bold text-kemix-text">{slot.drugName}</Text>
      ) : null}
      <Text className={`mt-2 text-3xl font-bold tracking-wider ${timeColor}`}>{timerLabel}</Text>
      {slot.nextDueAt ? (
        <Text className={`mt-2 text-[11px] ${subColor}`}>
          예정: {formatHistoryTime(slot.nextDueAt)} · {slot.intervalHours}시간 간격
        </Text>
      ) : (
        <Text className={`mt-2 text-[11px] ${subColor}`}>{slot.intervalHours}시간 간격</Text>
      )}
      {remainingMs !== null && remainingMs <= 0 ? (
        <View className="mt-3 flex-row items-center">
          <Ionicons name="alarm" size={16} color={accent === 'amber' ? '#d97706' : '#7c3aed'} />
          <Text className={`ml-1 text-xs font-semibold ${titleColor}`}>복용 알람 활성</Text>
        </View>
      ) : null}
    </View>
  );
}

type MedicationAlarmBannerProps = {
  drugName: string;
  slotLabel: string;
  onDismiss: () => void;
};

export function MedicationAlarmBanner({
  drugName,
  slotLabel,
  onDismiss,
}: MedicationAlarmBannerProps) {
  return (
    <Pressable
      className="mb-4 rounded-2xl border-2 border-red-400 bg-red-50 p-4 active:bg-red-100"
      onPress={onDismiss}
    >
      <View className="flex-row items-center">
        <Ionicons name="notifications" size={28} color="#dc2626" />
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-red-800">{slotLabel} 복용 알람</Text>
          <Text className="mt-1 text-sm text-red-700">
            {drugName || '등록된 약물'} 복용 시간입니다. 탭하여 알람을 확인하세요.
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-center text-[11px] text-red-600">
        브라우저 알림·진동이 지원되는 환경에서 자동으로 울립니다.
      </Text>
    </Pressable>
  );
}
