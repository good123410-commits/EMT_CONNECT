import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getOAuthLinkErrorMessage } from '@/services/authService';
import type { AuthIntent } from '@/utils/authIntent';

type SocialLoginButtonsProps = {
  intent?: AuthIntent;
  kakaoLabel?: string;
  googleLabel?: string;
  disabled?: boolean;
  onSuccess?: () => void;
};

export function SocialLoginButtons({
  intent,
  kakaoLabel = '카카오로 시작하기',
  googleLabel = '구글로 시작하기',
  disabled = false,
  onSuccess,
}: SocialLoginButtonsProps) {
  const { signInWithOAuth } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<'kakao' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = disabled || oauthLoading !== null;

  const handleOAuth = async (provider: 'kakao' | 'google') => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider, { intent });
      onSuccess?.();
    } catch (err) {
      setError(getOAuthLinkErrorMessage(err));
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <View>
      <Text className="mb-3 text-center text-xs font-medium text-slate-500">
        소셜 계정으로 간편 로그인
      </Text>

      <Pressable
        className={`mb-2.5 items-center rounded-xl py-3.5 ${busy ? 'bg-[#FEE500]/70' : 'bg-[#FEE500]'}`}
        disabled={busy}
        onPress={() => void handleOAuth('kakao')}
      >
        {oauthLoading === 'kakao' ? (
          <ActivityIndicator color="#3c1e1e" />
        ) : (
          <Text className="font-bold text-[#3c1e1e]">🟡 {kakaoLabel}</Text>
        )}
      </Pressable>

      <Pressable
        className={`items-center rounded-xl border border-slate-200 py-3.5 ${busy ? 'bg-slate-50' : 'bg-white'}`}
        disabled={busy}
        onPress={() => void handleOAuth('google')}
      >
        {oauthLoading === 'google' ? (
          <ActivityIndicator color="#334155" />
        ) : (
          <Text className="font-semibold text-slate-800">⚪ {googleLabel}</Text>
        )}
      </Pressable>

      {error ? (
        <Text className="mt-3 text-center text-sm text-red-600" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function AuthDivider() {
  return (
    <View className="my-6 flex-row items-center">
      <View className="h-px flex-1 bg-slate-200" />
      <Text className="mx-3 text-xs text-slate-400">또는 이메일로 계속</Text>
      <View className="h-px flex-1 bg-slate-200" />
    </View>
  );
}
