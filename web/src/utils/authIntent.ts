const AUTH_INTENT_KEY = 'kemix-auth-intent';

export type AuthIntent =
  | { type: 'community-write' }
  | { type: 'guide-unlock'; slug: string };

export function storeAuthIntent(intent: AuthIntent) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(intent));
}

export function consumeAuthIntent(): AuthIntent | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(AUTH_INTENT_KEY);
  sessionStorage.removeItem(AUTH_INTENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthIntent;
    if (parsed?.type === 'community-write' || parsed?.type === 'guide-unlock') {
      return parsed;
    }
  } catch {
    sessionStorage.removeItem(AUTH_INTENT_KEY);
  }

  return null;
}
