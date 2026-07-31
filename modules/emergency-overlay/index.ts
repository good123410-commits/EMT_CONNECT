import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type EmergencyOverlayNative = {
  canDrawOverlays: () => Promise<boolean>;
  requestOverlayPermission: () => Promise<void>;
  setOverlayEnabled: (enabled: boolean) => Promise<void>;
  isOverlayEnabled: () => Promise<boolean>;
  syncCardData: (json: string) => Promise<void>;
};

const native: EmergencyOverlayNative | null =
  Platform.OS === 'android' ? requireOptionalNativeModule<EmergencyOverlayNative>('EmergencyOverlay') : null;

export const isEmergencyOverlaySupported = Platform.OS === 'android' && native !== null;
export async function canDrawEmergencyOverlay(): Promise<boolean> {
  if (!native) return false;
  return native.canDrawOverlays();
}

export async function requestEmergencyOverlayPermission(): Promise<void> {
  if (!native) return;
  await native.requestOverlayPermission();
}

export async function setEmergencyOverlayEnabled(enabled: boolean): Promise<void> {
  if (!native) return;
  await native.setOverlayEnabled(enabled);
}

export async function isEmergencyOverlayEnabled(): Promise<boolean> {
  if (!native) return false;
  return native.isOverlayEnabled();
}

export async function syncEmergencyOverlayCardData(json: string): Promise<void> {
  if (!native) return;
  await native.syncCardData(json);
}
