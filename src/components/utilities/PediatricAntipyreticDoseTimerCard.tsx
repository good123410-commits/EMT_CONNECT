import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { AntipyreticDoseAlert } from '@/hooks/usePediatricAntipyreticDoseTimer';
import {
  formatAntipyreticDateTime,
  formatCountdown,
  getAntipyreticDrug,
  getFamilyLabel,
  type AntipyreticDoseHistoryEntry,
  type AntipyreticFamilySchedule,
  type AntipyreticDrugFamily,
} from '@/utils/pediatricAntipyreticCalc';

type PediatricAntipyreticDoseTimerCardProps = {
  family: AntipyreticDrugFamily | null;
  schedule: AntipyreticFamilySchedule | null;
  history: AntipyreticDoseHistoryEntry[];
  now: Date;
  recording: boolean;
  resetting: boolean;
  alert: AntipyreticDoseAlert | null;
  onRecordDose: () => void;
  onResetHistory: () => void;
  onDismissAlert: () => void;
};

function TimerRow({
  label,
  targetAt,
  now,
  highlight = false,
}: {
  label: string;
  targetAt: Date | null;
  now: Date;
  highlight?: boolean;
}) {
  const remainingMs = targetAt ? targetAt.getTime() - now.getTime() : 0;
  const ready = !targetAt || remainingMs <= 0;

  return (
    <View
      className={`rounded-xl border px-3 py-3 ${
        highlight && ready
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-kemix-border-light bg-kemix-bg'
      }`}
    >
      <Text className="text-[11px] font-semibold text-kemix-text-secondary">{label}</Text>
      {targetAt ? (
        <>
          <Text
            className={`mt-1 text-sm font-bold ${
              ready ? 'text-emerald-700' : 'text-kemix-text'
            }`}
          >
            {ready ? '복용 가능' : formatCountdown(remainingMs)}
          </Text>
          <Text className="mt-1 text-[11px] text-kemix-text-secondary">
            {formatAntipyreticDateTime(targetAt)}
          </Text>
        </>
      ) : (
        <Text className="mt-1 text-sm font-bold text-emerald-700">제한 없음</Text>
      )}
    </View>
  );
}

function HistoryRow({ entry }: { entry: AntipyreticDoseHistoryEntry }) {
  const drug = getAntipyreticDrug(entry.drugId);
  const takenAt = new Date(entry.takenAt);

  return (
    <View className="rounded-xl border border-kemix-border-light bg-kemix-bg px-3 py-2.5">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-xs font-bold text-kemix-text">{getFamilyLabel(entry.family)}</Text>
        <Text className="text-[10px] text-kemix-text-secondary">
          {formatAntipyreticDateTime(takenAt)}
        </Text>
      </View>
      {drug ? (
        <Text className="mt-1 text-[11px] text-kemix-muted">{drug.label} 투약 기록</Text>
      ) : null}
    </View>
  );
}

export function PediatricAntipyreticDoseTimerCard({
  family,
  schedule,
  history,
  now,
  recording,
  resetting,
  alert,
  onRecordDose,
  onResetHistory,
  onDismissAlert,
}: PediatricAntipyreticDoseTimerCardProps) {
  const familyLabel = family ? getFamilyLabel(family) : null;
  const canRecord = !!(family && schedule?.canTakeNow && !recording && !resetting);

  return (
    <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
      <View className="mb-2 flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-bold text-kemix-text">투약 기록 · 알람</Text>
        <Pressable
          accessibilityLabel="투약 기록 초기화"
          accessibilityRole="button"
          className={`flex-row items-center gap-1.5 rounded-lg border px-3 py-2 ${
            history.length === 0
              ? 'border-kemix-border bg-kemix-bg'
              : 'border-red-200 bg-red-50 active:bg-red-100'
          }`}
          disabled={resetting || history.length === 0}
          hitSlop={8}
          onPress={onResetHistory}
        >
          <Ionicons
            name="refresh"
            size={15}
            color={history.length === 0 ? '#94a3b8' : '#dc2626'}
          />
          <Text
            className={`text-xs font-bold ${
              history.length === 0 ? 'text-kemix-muted' : 'text-red-700'
            }`}
          >
            {resetting ? '초기화 중…' : '기록 초기화'}
          </Text>
        </Pressable>
      </View>

      {!family || !familyLabel ? (
        <Text className="text-sm text-kemix-text-secondary">
          약물 계열을 선택하면 투약 기록과 다음 복용 알람을 사용할 수 있습니다.
        </Text>
      ) : (
        <View className="gap-3">
          {alert ? (
            <View className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
              <Text className="text-xs font-bold text-amber-900">{familyLabel} 알림</Text>
              <Text className="mt-1 text-sm leading-5 text-amber-800">{alert.message}</Text>
              <Pressable className="mt-2 self-start" onPress={onDismissAlert}>
                <Text className="text-xs font-semibold text-amber-900">확인</Text>
              </Pressable>
            </View>
          ) : null}

          <View className="rounded-xl bg-violet-50 px-3 py-3">
            <Text className="text-[11px] font-semibold text-violet-800">마지막 투약 (선택 계열)</Text>
            <Text className="mt-1 text-sm font-bold text-violet-950">
              {schedule?.lastDoseAt
                ? formatAntipyreticDateTime(schedule.lastDoseAt)
                : '기록 없음'}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TimerRow
                label="동일 계열 다음 복용"
                targetAt={schedule?.nextSameFamilyAt ?? null}
                now={now}
                highlight
              />
            </View>
            <View className="flex-1">
              <TimerRow
                label="교차 복용 가능"
                targetAt={schedule?.nextCrossDoseAt ?? null}
                now={now}
                highlight
              />
            </View>
          </View>

          <Pressable
            className={`items-center rounded-xl px-4 py-3 ${
              canRecord ? 'bg-violet-600 active:bg-violet-700' : 'bg-slate-300'
            }`}
            disabled={!canRecord}
            onPress={onRecordDose}
          >
            <Text className="text-sm font-bold text-white">
              {recording
                ? '저장 중…'
                : canRecord
                  ? `${familyLabel} 투약 완료`
                  : '아직 투약할 시간이 아닙니다'}
            </Text>
          </Pressable>

          {history.length > 0 ? (
            <View className="gap-2">
              <Text className="text-[11px] font-semibold text-kemix-text-secondary">
                투약 기록 ({history.length}건)
              </Text>
              {history.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))}
            </View>
          ) : (
            <Text className="text-[11px] leading-5 text-kemix-muted">
              투약 완료를 누르면 기록이 아래에 누적됩니다.
            </Text>
          )}

          <Text className="text-[11px] leading-5 text-kemix-muted">
            동일 계열 재투약·교차 복용 간격이 지나지 않으면 기록이 차단됩니다. 이부프로펜과
            덱시부프로펜은 부루펜 계열로 동일하게 취급됩니다.
          </Text>
        </View>
      )}
    </View>
  );
}
