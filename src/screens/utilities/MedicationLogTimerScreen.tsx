import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { MedicationAlarmBanner, MedicationTimerCard } from '@/components/utilities/MedicationTimerCard';
import { MedicationDrugForm } from '@/components/utilities/MedicationDrugForm';
import { MedicationHistoryShareBar } from '@/components/utilities/MedicationHistoryShareBar';
import { MedicationIntervalPicker } from '@/components/utilities/MedicationIntervalPicker';
import { MedicationShortcutCard } from '@/components/utilities/MedicationShortcutCard';
import { UtilityResultCard } from '@/components/utilities/UtilityResultCard';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';
import { useMoreMenu } from '@/contexts/MoreMenuContext';
import {
  appendMedicationHistory,
  deleteMedicationHistoryEntry,
  loadMedicationLogStore,
  saveMedicationRegistration,
} from '@/services/medicationLogStorage';
import {
  DEFAULT_DRUG_SLOT,
  DEFAULT_REGISTRATION,
  type MedicationDrugSlot,
  type MedicationHistoryEntry,
  type MedicationRegistration,
} from '@/types/medicationLog';
import { computeNextDueAt, formatHistoryTime, getRemainingMs } from '@/utils/medicationTimer';
import {
  ensureMedicationNotificationPermission,
  triggerMedicationAlarm,
} from '@/utils/medicationNotification';

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <View className="mb-3 flex-row items-center">
      <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-violet-600">
        <Text className="text-xs font-bold text-white">{step}</Text>
      </View>
      <Text className="text-base font-bold text-kemix-text">{title}</Text>
    </View>
  );
}

const ACCENT_CYCLE: Array<'violet' | 'amber'> = ['violet', 'amber'];

export function MedicationLogTimerScreen() {
  const { openMedicationInstant } = useMoreMenu();
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<MedicationRegistration>(DEFAULT_REGISTRATION());
  const [history, setHistory] = useState<MedicationHistoryEntry[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());
  const [alarmActive, setAlarmActive] = useState<Record<string, boolean>>({});
  const [alarmDismissed, setAlarmDismissed] = useState<Record<string, boolean>>({});
  const triggeredDueRef = useRef<Record<string, string | null>>({});

  useEffect(() => {
    void loadMedicationLogStore().then((store) => {
      if (store.registration) {
        setRegistration(store.registration);
      }
      setHistory(store.history);
      setLoading(false);
    });
    void ensureMedicationNotificationPermission();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const persistRegistration = useCallback(async (next: MedicationRegistration) => {
    setRegistration(next);
    await saveMedicationRegistration(next);
  }, []);

  const updateMedication = useCallback(
    (medicationId: string, patch: Partial<MedicationDrugSlot>) => {
      const next: MedicationRegistration = {
        medications: registration.medications.map((med) =>
          med.id === medicationId ? { ...med, ...patch } : med,
        ),
      };
      void persistRegistration(next);
    },
    [registration, persistRegistration],
  );

  const addMedication = () => {
    const next: MedicationRegistration = {
      medications: [...registration.medications, DEFAULT_DRUG_SLOT()],
    };
    void persistRegistration(next);
  };

  const removeMedication = (medicationId: string) => {
    Alert.alert('약물 삭제', '등록된 약물을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const remaining = registration.medications.filter((med) => med.id !== medicationId);
          const next: MedicationRegistration = {
            medications: remaining.length > 0 ? remaining : [DEFAULT_DRUG_SLOT()],
          };
          setAlarmActive((prev) => {
            const copy = { ...prev };
            delete copy[medicationId];
            return copy;
          });
          setAlarmDismissed((prev) => {
            const copy = { ...prev };
            delete copy[medicationId];
            return copy;
          });
          delete triggeredDueRef.current[medicationId];
          void persistRegistration(next);
        },
      },
    ]);
  };

  const checkMedicationAlarm = useCallback(
    (medication: MedicationDrugSlot) => {
      const due = medication.nextDueAt;
      if (!due || alarmDismissed[medication.id]) return;
      const remaining = getRemainingMs(due, nowMs);
      if (remaining === null || remaining > 0) return;
      if (triggeredDueRef.current[medication.id] === due) return;
      triggeredDueRef.current[medication.id] = due;
      setAlarmActive((prev) => ({ ...prev, [medication.id]: true }));
      void triggerMedicationAlarm(medication.drugName);
    },
    [alarmDismissed, nowMs],
  );

  useEffect(() => {
    for (const med of registration.medications) {
      if (med.drugName.trim()) {
        checkMedicationAlarm(med);
      }
    }
  }, [registration.medications, checkMedicationAlarm]);

  const handleCompleteDose = async (medication: MedicationDrugSlot) => {
    if (!medication.drugName.trim()) {
      Alert.alert('등록 필요', '먼저 약 이름을 입력해 주세요.');
      return;
    }

    const takenAt = new Date().toISOString();
    const nextDue = computeNextDueAt(takenAt, medication.intervalHours);
    const updatedSlot: MedicationDrugSlot = {
      ...medication,
      drugName: medication.drugName.trim(),
      dosePerServing: medication.dosePerServing.trim(),
      lastTakenAt: takenAt,
      nextDueAt: nextDue,
    };

    const next: MedicationRegistration = {
      medications: registration.medications.map((med) =>
        med.id === medication.id ? updatedSlot : med,
      ),
    };

    triggeredDueRef.current[medication.id] = null;
    setAlarmActive((prev) => ({ ...prev, [medication.id]: false }));
    setAlarmDismissed((prev) => ({ ...prev, [medication.id]: false }));

    await persistRegistration(next);

    const store = await appendMedicationHistory({
      medicationId: medication.id,
      drugName: updatedSlot.drugName,
      dosePerServing: updatedSlot.dosePerServing || '—',
      takenAt,
    });
    setHistory(store.history);
    Alert.alert('복용 기록', '복용 완료가 기록지에 저장되었습니다.');
  };

  const dismissAlarm = (medicationId: string) => {
    setAlarmActive((prev) => ({ ...prev, [medicationId]: false }));
    setAlarmDismissed((prev) => ({ ...prev, [medicationId]: true }));
  };

  const deleteHistoryEntry = (entry: MedicationHistoryEntry) => {
    Alert.alert('기록 삭제', '이 복용 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void deleteMedicationHistoryEntry(entry.id).then((store) => setHistory(store.history));
        },
      },
    ]);
  };

  const activeMedications = registration.medications.filter((med) => med.drugName.trim());

  if (loading) {
    return (
      <UtilityToolShell>
        <Text className="text-center text-sm text-kemix-text-secondary">불러오는 중…</Text>
      </UtilityToolShell>
    );
  }

  return (
    <UtilityToolShell>
      {registration.medications.map((med) =>
        alarmActive[med.id] ? (
          <MedicationAlarmBanner
            key={`alarm-${med.id}`}
            drugName={med.drugName}
            slotLabel={med.drugName.trim() || '약물'}
            onDismiss={() => dismissAlarm(med.id)}
          />
        ) : null,
      )}

      <Pressable
        className="mb-5 flex-row items-center justify-center rounded-xl bg-green-600 py-3.5 active:bg-green-700"
        onPress={openMedicationInstant}
      >
        <Ionicons name="flash" size={18} color="#fff" />
        <Text className="ml-2 text-base font-bold text-white">타이머 즉시 시작</Text>
      </Pressable>

      <MedicationShortcutCard />

      <View className="mb-5 rounded-2xl border border-violet-100 bg-kemix-surface p-4">
        <StepHeader step={1} title="약물 등록" />

        <View className="gap-3">
          {registration.medications.map((med, index) => (
            <MedicationDrugForm
              key={med.id}
              title={`약물 ${index + 1}`}
              slot={med}
              onChange={(patch) => updateMedication(med.id, patch)}
              onDelete={() => removeMedication(med.id)}
              showDelete={registration.medications.length > 1}
            />
          ))}
        </View>

        <Pressable
          className="mt-3 flex-row items-center justify-center rounded-xl border border-violet-200 bg-violet-50 py-3 active:bg-violet-100"
          onPress={addMedication}
        >
          <Ionicons name="add" size={18} color="#7c3aed" />
          <Text className="ml-1 text-sm font-bold text-violet-700">약물 추가</Text>
        </Pressable>
      </View>

      <View className="mb-5 rounded-2xl border border-violet-100 bg-kemix-surface p-4">
        <StepHeader step={2} title="복용 타이머 및 기록" />
        <Text className="mb-3 text-xs leading-5 text-kemix-text-secondary">
          각 약물의 복용 간격을 설정하고, 복용 완료 시 타이머가 재설정됩니다.
        </Text>

        {activeMedications.length === 0 ? (
          <Text className="text-sm text-kemix-text-secondary">등록된 약물이 없습니다. 위에서 약물을 추가해 주세요.</Text>
        ) : (
          activeMedications.map((med, index) => {
            const accent = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
            return (
              <View
                key={med.id}
                className="mb-4 rounded-xl border border-kemix-border-light bg-kemix-bg/50 p-3 last:mb-0"
              >
                <Text className="mb-2 text-sm font-bold text-kemix-text">{med.drugName}</Text>

                <MedicationIntervalPicker
                  intervalHours={med.intervalHours}
                  onIntervalChange={(hours) => updateMedication(med.id, { intervalHours: hours })}
                  label="복용 간격"
                />

                <MedicationTimerCard
                  label="다음 복용까지"
                  slot={med}
                  nowMs={nowMs}
                  accent={accent}
                />

                <Pressable
                  className="mt-3 items-center rounded-xl bg-green-600 py-3 active:bg-green-700"
                  onPress={() => void handleCompleteDose(med)}
                >
                  <Text className="text-base font-bold text-white">복용 완료</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>

      <UtilityResultCard title="복용 기록지 (History)">
        <MedicationHistoryShareBar history={history} registration={registration} />
        {history.length === 0 ? (
          <Text className="text-sm text-kemix-text-secondary">아직 복용 기록이 없습니다.</Text>
        ) : (
          <View className="gap-2">
            {history.map((entry) => (
              <View
                key={entry.id}
                className="flex-row items-start rounded-xl border border-kemix-border-light bg-kemix-bg px-3 py-3"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-kemix-text">{entry.drugName}</Text>
                  <Text className="mt-0.5 text-xs text-kemix-text-secondary">{entry.dosePerServing}</Text>
                  <Text className="mt-1 text-[11px] text-kemix-muted">
                    {formatHistoryTime(entry.takenAt)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="기록 삭제"
                  className="h-8 w-8 items-center justify-center rounded-full bg-kemix-surface active:bg-red-50"
                  onPress={() => deleteHistoryEntry(entry)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={18} color="#94a3b8" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </UtilityResultCard>
    </UtilityToolShell>
  );
}
