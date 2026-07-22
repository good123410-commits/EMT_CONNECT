import type { Provider, User } from '@supabase/supabase-js';
import { getOAuthRedirectUrl, storeAuthReturnPath } from '../utils/authRedirects';
import { supabase } from '../lib/supabase';

export type AuthProviderKind = 'email' | 'google' | 'kakao' | 'apple' | 'github';

export type LinkedAuthProvider = {
  id: AuthProviderKind;
  label: string;
  connected: boolean;
  linkable: boolean;
};

const PROVIDER_LABELS: Record<string, string> = {
  email: '이메일',
  google: 'Google',
  kakao: '카카오',
  apple: 'Apple',
  github: 'GitHub',
};

const LINKABLE_OAUTH: Provider[] = ['google', 'kakao'];

function normalizeProvider(provider: string): AuthProviderKind {
  if (provider === 'email') return 'email';
  if (provider in PROVIDER_LABELS) return provider as AuthProviderKind;
  return provider as AuthProviderKind;
}

/** Supabase identities + app_metadata 기반 연결된 로그인 수단 */
export function getConnectedProviders(user: User | null): AuthProviderKind[] {
  if (!user) return [];

  const providers = new Set<AuthProviderKind>();

  for (const identity of user.identities ?? []) {
    if (identity.provider) providers.add(normalizeProvider(identity.provider));
  }

  if (user.email && (user.app_metadata?.providers as string[] | undefined)?.includes('email')) {
    providers.add('email');
  }

  if (providers.size === 0 && user.email) {
    providers.add('email');
  }

  return Array.from(providers);
}

export function getLinkedAuthProviders(user: User | null): LinkedAuthProvider[] {
  const connected = new Set(getConnectedProviders(user));
  const rows: LinkedAuthProvider[] = [
    {
      id: 'email',
      label: PROVIDER_LABELS.email,
      connected: connected.has('email'),
      linkable: false,
    },
    {
      id: 'kakao',
      label: PROVIDER_LABELS.kakao,
      connected: connected.has('kakao'),
      linkable: LINKABLE_OAUTH.includes('kakao'),
    },
    {
      id: 'google',
      label: PROVIDER_LABELS.google,
      connected: connected.has('google'),
      linkable: LINKABLE_OAUTH.includes('google'),
    },
  ];

  return rows;
}

export async function reconcileProfileAfterAuth(): Promise<void> {
  const { error } = await supabase.rpc('reconcile_my_profile_on_login');
  if (error) {
    const { error: fallbackError } = await supabase.rpc('ensure_my_user_profile');
    if (fallbackError) {
      console.warn('[auth] profile reconcile failed:', error.message, fallbackError.message);
    }
  }
}

export async function linkOAuthProvider(provider: Provider): Promise<void> {
  storeAuthReturnPath();
  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: getOAuthRedirectUrl(),
    },
  });
  if (error) throw error;
}

export function getOAuthLinkErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (
    lower.includes('already registered') ||
    lower.includes('already exists') ||
    lower.includes('identity already exists')
  ) {
    return '이미 가입된 이메일입니다. 이메일 로그인 후 설정에서 소셜 계정을 연동해 주세요.';
  }

  if (lower.includes('email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.';
  }

  return message || '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
}
