import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MedicationIntervalPicker } from '@/components/utilities/MedicationIntervalPicker';
import { UtilityFormField } from '@/components/utilities/UtilityFormField';
import { APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import {
  activateMedicationTimer,
  quickStartMedicationTimer,
} from '@/services/medicationQuickStart';
import { loadMedicationLogStore } from '@/services/medicationLogStorage';
import type { MedicationDrugSlot, MedicationRegistration } from '@/types/medicationLog';
import { formatCountdown, getRemainingMs } from '@/utils/medicationTimer';

type MedicationInstantStartModalProps = {
  visible: boolean;
  onClose: () => void;
  onTimerStarted?: (registration: MedicationRegistration) => void;
  onOpenFullScreen?: () => void;
};

export function MedicationInstantStartModal({
  visible,
  onClose,
  onTimerStarted,
  onOpenFullScreen,
}: MedicationInstantStartModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemedColors();
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<MedicationRegistration | null>(null);
  const [drugName, setDrugName] = useState('');
  const [dosePerServing, setDosePerServing] = useState('');
  const [intervalHours, setIntervalHours] = useState(4);
  const [starting, setStarting] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  const activeMeds = registration?.medications.filter((med) => med.drugName.trim()) ?? [];

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    void loadMedicationLogStore().then((store) => {
      const reg = store.registration;
      setRegistration(reg);
      const first = reg?.medications.find((med) => med.drugName.trim()) ?? reg?.medications[0];
      if (first) {
        setDrugName(first.drugName);
        setDosePerServing(first.dosePerServing);
        setIntervalHours(first.intervalHours);
      }
      setLoading(false);
    });
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const handleStartExisting = async (med: MedicationDrugSlot) => {
    if (!registration) return;
    setStarting(true);
    try {
      const next = await activateMedicationTimer(registration, med.id);
      setRegistration(next);
      onTimerStarted?.(next);
    } finally {
      setStarting(false);
    }
  };

  const handleQuickStart = async () => {
    if (!drugName.trim()) return;
    if (!registration) return;

    setStarting(true);
    try {
      const targetId = registration.medications[0]?.id;
      const next = await quickStartMedicationTimer(registration, {
        drugName,
        dosePerServing,
        intervalHours,
      }, targetId);
      setRegistration(next);
      onTimerStarted?.(next);
    } finally {
      setStarting(false);
    }
  };

  const runningMed = activeMeds.find((med) => med.nextDueAt);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/45" onPress={onClose}>
        <View className="flex-1" />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          borderTopLeftRadius: APP_RADIUS.cardLg,
          borderTopRightRadius: APP_RADIUS.cardLg,
          backgroundColor: colors.surface,
          paddingBottom: Math.max(insets.bottom, 16),
          maxHeight: '85%',
        }}
      >
        <View className="flex-row items-center justify-between border-b border-kemix-border-light px-5 py-4">
          <Text className="text-base font-bold text-kemix-text">약물 타이머 즉시 시작</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : (
          <View className="px-5 pt-4">
            {runningMed?.nextDueAt ? (
              <View className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <Text className="text-xs font-semibold text-green-800">타이머 가동 중</Text>
                <Text className="mt-1 text-sm font-bold text-kemix-text">{runningMed.drugName}</Text>
                <Text className="mt-2 text-2xl font-bold tracking-wider text-green-800">
                  {formatCountdown(getRemainingMs(runningMed.nextDueAt, nowMs) ?? 0)}
                </Text>
              </View>
            ) : null}

            {activeMeds.length > 0 ? (
              <View className="mb-4 gap-2">
                <Text className="text-xs font-semibold text-kemix-text-secondary">등록된 약물 · 원터치 시작</Text>
                {activeMeds.map((med) => (
                  <Pressable
                    key={med.id}
                    className="flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 active:bg-kemix-elevated"
                    disabled={starting}
                    onPress={() => void handleStartExisting(med)}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-bold text-kemix-text">{med.drugName}</Text>
                      <Text className="text-xs text-kemix-text-secondary">
                        {med.intervalHours}시간 간격 · {med.dosePerServing || '용량 미입력'}
                      </Text>
                    </View>
                    <View className="flex-row items-center rounded-lg bg-green-600 px-3 py-2">
                      <Ionicons name="play" size={14} color="#fff" />
                      <Text className="ml-1 text-xs font-bold text-white">시작</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className="mb-2">
                <Text className="mb-3 text-xs leading-5 text-kemix-text-secondary">
                  약 이름만 입력하고 타이머를 즉시 가동할 수 있습니다.
                </Text>
                <UtilityFormField
                  label="약 이름"
                  placeholder="예: 타이레놀시럽"
                  value={drugName}
                  onChangeText={setDrugName}
                />
                <UtilityFormField
                  label="1회 복용량 (선택)"
                  placeholder="예: 5mL"
                  value={dosePerServing}
                  onChangeText={setDosePerServing}
                />
                <MedicationIntervalPicker
                  intervalHours={intervalHours}
                  onIntervalChange={setIntervalHours}
                  label="복용 간격"
                />
                <Pressable
                  className={`mt-2 flex-row items-center justify-center rounded-xl py-3.5 ${
                    starting || !drugName.trim() ? 'bg-green-300' : 'bg-green-600 active:bg-green-700'
                  }`}
                  disabled={starting || !drugName.trim()}
                  onPress={() => void handleQuickStart()}
                >
                  {starting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={18} color="#fff" />
                      <Text className="ml-2 text-sm font-bold text-white">타이머 즉시 가동</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {onOpenFullScreen ? (
              <Pressable
                className="mt-3 items-center rounded-xl border border-kemix-border py-3 active:bg-kemix-bg"
                onPress={() => {
                  onClose();
                  onOpenFullScreen();
                }}
              >
                <Text className="text-sm font-semibold text-kemix-text-secondary">상세 기록지 열기</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
