import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type MedicationShortcutNative = {
  isPinShortcutSupported: () => Promise<boolean>;
  requestPinShortcut: (deepLinkUrl: string, label: string) => Promise<boolean>;
  openHomeScreen: () => Promise<void>;
};

const native: MedicationShortcutNative | null =
  Platform.OS === 'android' ? requireOptionalNativeModule<MedicationShortcutNative>('MedicationShortcut') : null;

export const isMedicationShortcutSupported = Platform.OS === 'android' && native !== null;
export async function canPinMedicationShortcut(): Promise<boolean> {
  if (!native) return false;
  return native.isPinShortcutSupported();
}

export async function requestPinMedicationShortcut(
  deepLinkUrl: string,
  label = '약물 타이머',
): Promise<boolean> {
  if (!native) return false;
  return native.requestPinShortcut(deepLinkUrl, label);
}

export async function openAndroidHomeScreen(): Promise<void> {
  if (!native) return;
  await native.openHomeScreen();
}
