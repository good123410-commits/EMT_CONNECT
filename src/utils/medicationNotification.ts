import { Alert, Platform, Vibration } from 'react-native';

let permissionRequested = false;

/** 웹 Notification API / 네이티브 진동 + 알림 권한 요청 */
export async function ensureMedicationNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    if (!permissionRequested) {
      permissionRequested = true;
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return Notification.permission === 'granted';
  }
  return true;
}

export async function triggerMedicationAlarm(drugName: string): Promise<void> {
  const label = drugName.trim() || '등록된 약물';

  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification('KEMIX 복용 알람', {
          body: `${label} 복용 시간입니다.`,
          tag: 'kemix-medication-alarm',
          requireInteraction: true,
        });
      } catch {
        // fallback below
      }
    }
  }

  if (Platform.OS !== 'web') {
    try {
      Vibration.vibrate([0, 400, 200, 400, 200, 600]);
    } catch {
      // ignore
    }
  }

  if (Platform.OS !== 'web') {
    Alert.alert('복용 알람', `${label} 복용 시간입니다.`);
  }
}
