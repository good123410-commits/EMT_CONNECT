import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Expo Go 클라이언트 — SDK 53+ 원격 푸시 미지원 */
export function isExpoGoClient(): boolean {
  return Constants.appOwnership === 'expo';
}

export function supportsNativePushNotifications(): boolean {
  if (Platform.OS === 'web') return false;
  return !isExpoGoClient();
}
