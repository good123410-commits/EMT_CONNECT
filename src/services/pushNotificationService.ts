import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supportsNativePushNotifications } from '@/utils/expoGo';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let handlerConfigured = false;
let androidChannelReady = false;

/** Expo Go에서는 require 하지 않음 — SDK 53+ 원격 푸시 미지원 에러 방지 */
function getNotificationsModule(): NotificationsModule | null {
  if (!supportsNativePushNotifications()) return null;

  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    // Optional native module — Expo Go에서는 로드하지 않음
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    if (__DEV__) {
      console.warn('[push] expo-notifications unavailable', error);
    }
    notificationsModule = null;
  }

  return notificationsModule;
}

export function configurePushNotificationHandler(): void {
  if (handlerConfigured || Platform.OS === 'web') return;

  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (androidChannelReady || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'KON 알림',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#2563eb',
  });
  androidChannelReady = true;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  configurePushNotificationHandler();
  await ensureAndroidChannel(Notifications);

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getExpoPushTokenIfGranted(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

  const granted = await ensureNotificationPermissions();
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data ?? null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[push] token fetch failed', error);
    }
    return null;
  }
}

export type LocalPushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function showLocalPushNotification(payload: LocalPushPayload): Promise<void> {
  if (Platform.OS === 'web') return;

  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  configurePushNotificationHandler();
  await ensureAndroidChannel(Notifications);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: true,
    },
    trigger: null,
  });
}
