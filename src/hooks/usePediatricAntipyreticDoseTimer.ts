import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';
import {
  notifyAntipyreticDoseRecorded,
  syncAntipyreticDoseNotifications,
} from '@/services/pediatricAntipyreticAlarmService';
import {
  appendAntipyreticDoseEntry,
  clearAntipyreticDoseHistory,
  loadAntipyreticDoseHistory,
} from '@/services/pediatricAntipyreticDoseStorage';
import {
  buildAntipyreticFamilySchedule,
  getRepresentativeDrugId,
  sortDoseHistoryNewestFirst,
  validateAntipyreticDose,
  type AntipyreticDoseHistoryEntry,
  type AntipyreticDrugFamily,
} from '@/utils/pediatricAntipyreticCalc';

export type AntipyreticDoseAlert = {
  family: AntipyreticDrugFamily;
  message: string;
};

export function usePediatricAntipyreticDoseTimer(family: AntipyreticDrugFamily | null) {
  const [history, setHistory] = useState<AntipyreticDoseHistoryEntry[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [recording, setRecording] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [alert, setAlert] = useState<AntipyreticDoseAlert | null>(null);
  const firedAlertsRef = useRef<Set<string>>(new Set());

  const refreshHistory = useCallback(async () => {
    const next = sortDoseHistoryNewestFirst(await loadAntipyreticDoseHistory());
    setHistory(next);
    await syncAntipyreticDoseNotifications(next);
    return next;
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(new Date());
        void refreshHistory();
      }
    });
    return () => subscription.remove();
  }, [refreshHistory]);

  const schedule = useMemo(() => {
    if (!family) return null;
    return buildAntipyreticFamilySchedule(family, history, now);
  }, [family, history, now]);

  const sortedHistory = useMemo(() => sortDoseHistoryNewestFirst(history), [history]);

  useEffect(() => {
    if (!family || !schedule) return;

    const checks: Array<{ key: string; at: Date | null; message: string }> = [
      {
        key: `${family}:same`,
        at: schedule.nextSameFamilyAt,
        message: '동일 계열 다음 복용 가능 시간입니다.',
      },
      {
        key: `${family}:cross`,
        at: schedule.nextCrossDoseAt,
        message: '교차 복용 가능 시간입니다.',
      },
    ];

    for (const check of checks) {
      if (!check.at || check.at > now) continue;
      if (firedAlertsRef.current.has(check.key)) continue;
      firedAlertsRef.current.add(check.key);
      setAlert({ family, message: check.message });
    }
  }, [family, now, schedule]);

  const recordDose = useCallback(async () => {
    if (!family) return;

    const validation = validateAntipyreticDose(family, history, new Date());
    if (!validation.ok) {
      Alert.alert(
        validation.reason === 'same_family' ? '투약 불가' : '교차 복용 불가',
        validation.message,
      );
      return;
    }

    setRecording(true);
    try {
      const takenAt = new Date();
      const drugId = getRepresentativeDrugId(family);
      const next = sortDoseHistoryNewestFirst(
        await appendAntipyreticDoseEntry(family, drugId, takenAt),
      );
      setHistory(next);
      firedAlertsRef.current.clear();
      setAlert(null);
      await syncAntipyreticDoseNotifications(next);
      await notifyAntipyreticDoseRecorded(family, takenAt);
      setNow(new Date());
    } finally {
      setRecording(false);
    }
  }, [family, history]);

  const resetHistory = useCallback(() => {
    confirmDestructiveAction(
      '기록 초기화',
      '모든 투약 기록과 타이머를 삭제할까요?',
      async () => {
        setResetting(true);
        try {
          await clearAntipyreticDoseHistory();
          setHistory([]);
          firedAlertsRef.current.clear();
          setAlert(null);
          await syncAntipyreticDoseNotifications([]);
          setNow(new Date());
        } finally {
          setResetting(false);
        }
      },
      '초기화',
    );
  }, []);

  const dismissAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return {
    history: sortedHistory,
    schedule,
    now,
    recording,
    resetting,
    alert,
    recordDose,
    resetHistory,
    dismissAlert,
    refreshHistory,
  };
}
