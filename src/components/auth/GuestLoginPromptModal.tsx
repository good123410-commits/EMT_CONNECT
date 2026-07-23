import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { openAuthScreen } from '@/navigation/rootNavigation';
import { getOAuthLinkErrorMessage } from '@/services/authService';
import type { AuthIntent } from '@/utils/authIntent';

type GuestLoginPromptModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  intent?: AuthIntent;
  kakaoLabel?: string;
  googleLabel?: string;
  dismissLabel?: string;
};

export function GuestLoginPromptModal({
  visible,
  onClose,
  title = '로그인이 필요한 서비스입니다',
  description = '로그인 또는 회원가입 후 이용할 수 있습니다.',
  intent,
  kakaoLabel = '카카오 3초 로그인',
  googleLabel = '구글 로그인',
  dismissLabel = '나중에 하기',
}: GuestLoginPromptModalProps) {
  const { signInWithOAuth } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<'kakao' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = oauthLoading !== null;

  const handleOAuth = async (provider: 'kakao' | 'google') => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider, { intent });
      onClose();
    } catch (err) {
      setError(getOAuthLinkErrorMessage(err));
    } finally {
      setOauthLoading(null);
    }
  };

  const handleSignUp = () => {
    onClose();
    openAuthScreen('SignUp');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={onClose}>
        <Pressable
          className="w-full max-w-md rounded-2xl bg-white p-5"
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="text-center text-lg font-bold text-slate-900">{title}</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-slate-600">{description}</Text>

          <View className="mt-5 gap-2.5">
            <Pressable
              className={`items-center rounded-xl py-3.5 ${busy ? 'bg-[#FEE500]/70' : 'bg-[#FEE500]'}`}
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
          </View>

          <Pressable
            className="mt-4 items-center rounded-xl bg-slate-900 py-3.5"
            disabled={busy}
            onPress={handleSignUp}
          >
            <Text className="font-bold text-white">회원가입</Text>
          </Pressable>

          <Pressable className="mt-3 items-center py-2" disabled={busy} onPress={onClose}>
            <Text className="text-sm font-medium text-slate-500">{dismissLabel}</Text>
          </Pressable>

          {error ? (
            <Text className="mt-3 text-center text-sm text-red-600" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
