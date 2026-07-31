import * as Linking from 'expo-linking';

export const MEDICATION_TIMER_DEEP_LINK_PATH = 'medication-timer';

export function getMedicationTimerDeepLink(): string {
  return Linking.createURL(MEDICATION_TIMER_DEEP_LINK_PATH);
}

export function isMedicationTimerDeepLink(url: string): boolean {
  const normalized = url.toLowerCase();
  return normalized.includes(MEDICATION_TIMER_DEEP_LINK_PATH);
}
