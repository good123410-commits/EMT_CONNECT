import { Alert, Platform } from 'react-native';
import {
  canPinMedicationShortcut,
  isMedicationShortcutSupported,
  openAndroidHomeScreen,
  requestPinMedicationShortcut,
} from 'medication-shortcut';
import { getMedicationTimerDeepLink } from '@/utils/medicationDeepLink';

export type MedicationShortcutResult = {
  action: 'pinned' | 'guide' | 'unsupported';
};

export async function addMedicationTimerShortcut(): Promise<MedicationShortcutResult> {
  if (Platform.OS === 'ios') {
    return { action: 'guide' };
  }

  if (!isMedicationShortcutSupported) {
    Alert.alert(
      '바로가기',
      '이 기기에서는 홈 화면 바로가기를 자동으로 추가할 수 없습니다. 안내를 따라 수동으로 추가해 주세요.',
    );
    return { action: 'guide' };
  }

  const canPin = await canPinMedicationShortcut();
  if (!canPin) {
    Alert.alert(
      '바로가기',
      '이 기기/OS 버전에서는 자동 바로가기 추가를 지원하지 않습니다. 안내를 확인해 주세요.',
    );
    return { action: 'guide' };
  }

  const deepLink = getMedicationTimerDeepLink();
  const pinned = await requestPinMedicationShortcut(deepLink, '약물 타이머');

  if (pinned) {
    Alert.alert(
      '바로가기 추가',
      '홈 화면에 「약물 타이머」 아이콘 추가를 확인해 주세요. 탭하면 타이머 화면이 즉시 열립니다.',
      [
        {
          text: '홈 화면으로',
          onPress: () => {
            void openAndroidHomeScreen();
          },
        },
        { text: '확인', style: 'cancel' },
      ],
    );
    return { action: 'pinned' };
  }

  return { action: 'guide' };
}

export async function openMedicationWidgetGuide(): Promise<void> {
  if (Platform.OS === 'android') {
    await openAndroidHomeScreen();
    return;
  }

  Alert.alert(
    '위젯 추가',
    '홈 화면 빈 공간을 길게 누른 뒤 「+」 → KEMIX 검색 → 복용 타이머 위젯을 추가하세요.',
  );
}
