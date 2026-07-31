import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
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
  await syncEmergencyOverlayCardData(JSON.stringify(data));
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
