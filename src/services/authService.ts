import type { Provider } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabaseClient';
import type { AuthIntent } from '@/utils/authIntent';
import { storeAuthIntent } from '@/utils/authIntent';

WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = 'ems-connect';

export function getOAuthRedirectUrl(): string {
  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'auth/callback',
  });
}

async function createSessionFromUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token) return;

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
}

export async function signInWithOAuthProvider(
  provider: Provider,
  options?: { intent?: AuthIntent },
): Promise<void> {
  if (options?.intent) {
    await storeAuthIntent(options.intent);
  }

  const redirectTo = getOAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('OAuth URL을 받지 못했습니다.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    await createSessionFromUrl(result.url);
    return;
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('로그인이 취소되었습니다.');
  }
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

  if (lower.includes('취소')) {
    return message;
  }

  return message || '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
}
