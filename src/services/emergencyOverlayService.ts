// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export type EmergencyOverlayState = {
  supported: boolean;
  enabled: boolean;
  hasPermission: boolean;
};
export async function loadEmergencyOverlayState(): Promise<EmergencyOverlayState> {
  return { supported: false, enabled: false, hasPermission: false };
}
export async function wasOverlayPermissionPrompted(): Promise<boolean> { return true; }
export async function markOverlayPermissionPrompted(): Promise<void> {}
export async function requestOverlayPermissionFlow(): Promise<boolean> { return false; }
export async function syncEmergencyOverlayFromCard(): Promise<void> {}
export async function enableEmergencyOverlay(): Promise<{ ok: boolean; reason?: string }> {
  return { ok: false, reason: 'unsupported' };
}
export async function disableEmergencyOverlay(): Promise<void> {}
export async function bootstrapEmergencyOverlay(): Promise<void> {}

/*
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
import { buildEmergencyOverlaySyncPayload } from '@/utils/emergencyCardEncoding';
import {
  canDrawEmergencyOverlay,
  isEmergencyOverlayEnabled,
  isEmergencyOverlaySupported,
  requestEmergencyOverlayPermission,
  setEmergencyOverlayEnabled,
  syncEmergencyOverlayCardData,
} from 'emergency-overlay';

const PROMPTED_KEY = 'kemix_emergency_overlay_prompted_v1';

export type EmergencyOverlayState = {
  supported: boolean;
  enabled: boolean;
  hasPermission: boolean;
};

export async function loadEmergencyOverlayState(): Promise<EmergencyOverlayState> {
  if (!isEmergencyOverlaySupported) {
    return { supported: false, enabled: false, hasPermission: false };
  }

  const [enabled, hasPermission] = await Promise.all([
    isEmergencyOverlayEnabled(),
    canDrawEmergencyOverlay(),
  ]);

  return { supported: true, enabled, hasPermission };
}

export async function wasOverlayPermissionPrompted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(PROMPTED_KEY);
  return value === 'true';
}

export async function markOverlayPermissionPrompted(): Promise<void> {
  await AsyncStorage.setItem(PROMPTED_KEY, 'true');
}

export async function requestOverlayPermissionFlow(): Promise<boolean> {
  await markOverlayPermissionPrompted();

  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  await requestEmergencyOverlayPermission();
  return canDrawEmergencyOverlay();
}

export async function syncEmergencyOverlayFromCard(data: EmergencyContactCardData): Promise<void> {
  if (!isEmergencyOverlaySupported) return;
  await syncEmergencyOverlayCardData(buildEmergencyOverlaySyncPayload(data));
}

export async function enableEmergencyOverlay(data: EmergencyContactCardData): Promise<{
  ok: boolean;
  reason?: 'no_permission' | 'no_content' | 'unsupported';
}> {
  if (!isEmergencyOverlaySupported) {
    return { ok: false, reason: 'unsupported' };
  }

  const hasContent = Boolean(
    data.fullName.trim() ||
      data.contact1Name.trim() ||
      data.contact1Phone.trim() ||
      data.allergiesMedications.trim(),
  );
  if (!hasContent) {
    return { ok: false, reason: 'no_content' };
  }

  const permitted = await canDrawEmergencyOverlay();
  if (!permitted) {
    return { ok: false, reason: 'no_permission' };
  }

  await syncEmergencyOverlayFromCard(data);
  await setEmergencyOverlayEnabled(true);
  return { ok: true };
}

export async function disableEmergencyOverlay(): Promise<void> {
  if (!isEmergencyOverlaySupported) return;
  await setEmergencyOverlayEnabled(false);
}

export async function bootstrapEmergencyOverlay(data: EmergencyContactCardData): Promise<void> {
  if (!isEmergencyOverlaySupported) return;
  await syncEmergencyOverlayFromCard(data);
  const enabled = await isEmergencyOverlayEnabled();
  if (enabled) {
    await setEmergencyOverlayEnabled(true);
  }
}

*/
