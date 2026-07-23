import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_INTENT_KEY = 'kemix-auth-intent';

export type AuthIntent =
  | { type: 'community-write' }
  | { type: 'guide-unlock'; slug: string }
  | { type: 'question-write' };

export async function storeAuthIntent(intent: AuthIntent): Promise<void> {
  await AsyncStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(intent));
}

export async function consumeAuthIntent(): Promise<AuthIntent | null> {
  const raw = await AsyncStorage.getItem(AUTH_INTENT_KEY);
  await AsyncStorage.removeItem(AUTH_INTENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthIntent;
    if (
      parsed?.type === 'community-write' ||
      parsed?.type === 'guide-unlock' ||
      parsed?.type === 'question-write'
    ) {
      return parsed;
    }
  } catch {
    await AsyncStorage.removeItem(AUTH_INTENT_KEY);
  }

  return null;
}
