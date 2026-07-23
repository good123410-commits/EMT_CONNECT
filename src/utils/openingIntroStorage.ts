import AsyncStorage from '@react-native-async-storage/async-storage';

export const OPENING_INTRO_HIDDEN_UNTIL_KEY = 'kemix-intro-hidden-until';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function shouldShowOpeningIntro(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(OPENING_INTRO_HIDDEN_UNTIL_KEY);
    if (!raw) return true;
    const until = Number(raw);
    if (!Number.isFinite(until)) return true;
    return Date.now() >= until;
  } catch {
    return true;
  }
}

export async function snoozeOpeningIntroForDay(): Promise<void> {
  await AsyncStorage.setItem(
    OPENING_INTRO_HIDDEN_UNTIL_KEY,
    String(Date.now() + ONE_DAY_MS),
  );
}

export async function clearOpeningIntroSnooze(): Promise<void> {
  await AsyncStorage.removeItem(OPENING_INTRO_HIDDEN_UNTIL_KEY);
}
