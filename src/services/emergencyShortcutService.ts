import { Alert, Platform } from 'react-native';
import {
  canPinMedicationShortcut,
  isMedicationShortcutSupported,
  requestPinEmergencyShortcut,
} from 'medication-shortcut';
import { getEmergencyQuickViewUrl } from '@/utils/emergencyCardEncoding';

export type EmergencyShortcutResult = {
  ok: boolean;
  message: string;
};

export async function addEmergencyLockScreenShortcut(): Promise<EmergencyShortcutResult> {
  if (Platform.OS !== 'android') {
    return { ok: false, message: 'Android에서만 잠금화면 바로가기를 추가할 수 있습니다.' };
  }

  if (!isMedicationShortcutSupported) {
    return { ok: false, message: '이 기기에서는 바로가기 추가를 지원하지 않습니다.' };
  }

  const canPin = await canPinMedicationShortcut();
  if (!canPin) {
    return {
      ok: false,
      message: '홈 화면 바로가기 고정을 지원하지 않는 기기입니다. 설정에서 잠금화면 바로가기를 수동으로 추가해 주세요.',
    };
  }

  const pinned = await requestPinEmergencyShortcut(getEmergencyQuickViewUrl(), 'KEMIX 응급');
  if (!pinned) {
    return { ok: false, message: '바로가기 추가가 취소되었거나 실패했습니다.' };
  }

  return {
    ok: true,
    message: '바로가기 추가를 요청했습니다. 안내에 따라 잠금화면에 고정해 주세요.',
  };
}

export function promptEmergencyShortcutResult(result: EmergencyShortcutResult): void {
  Alert.alert(result.ok ? '바로가기' : '안내', result.message);
}
