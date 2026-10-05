import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getOAuthLinkErrorMessage } from '@/services/authService';
import type { AuthIntent } from '@/utils/authIntent';

const BUTTON_HEIGHT = 50;
const BUTTON_RADIUS = 8;
const ICON_INSET_LEFT = 16;
const BUTTON_GAP = 12;

type SocialLoginButtonsProps = {
  intent?: AuthIntent;
  kakaoLabel?: string;
  googleLabel?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  /** 로그인 화면과 동일한 좌우 여백(24) — 부모 padding과 중복 시 0 */
  contentPaddingHorizontal?: number;
};

type OAuthProvider = 'kakao' | 'google';

function SocialOAuthButton({
  provider,
  label,
  loading,
  disabled,
  onPress,
  style,
  textStyle,
  icon,
}: {
  provider: OAuthProvider;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  textStyle: object;
  icon: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        style,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
    >
      <View style={styles.buttonContent}>
        {!loading ? <View style={styles.iconContainer}>{icon}</View> : null}
        {loading ? (
          <ActivityIndicator color={provider === 'kakao' ? '#191919' : '#374151'} />
        ) : (
          <Text style={[styles.buttonLabel, textStyle]}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

export function SocialLoginButtons({
  intent,
  kakaoLabel = '카카오로 시작하기',
  googleLabel = 'Google 계정으로 로그인',
  disabled = false,
  onSuccess,
  contentPaddingHorizontal = 0,
}: SocialLoginButtonsProps) {
  const { signInWithOAuth } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = disabled || oauthLoading !== null;

  const handleOAuth = async (provider: OAuthProvider) => {
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
    <View style={{ paddingHorizontal: contentPaddingHorizontal }}>
      <Text style={styles.sectionHint}>소셜 계정으로 간편 로그인</Text>

      <View style={styles.buttonStack}>
        <SocialOAuthButton
          provider="kakao"
          label={kakaoLabel}
          loading={oauthLoading === 'kakao'}
          disabled={busy}
          onPress={() => void handleOAuth('kakao')}
          style={styles.kakaoButton}
          textStyle={styles.kakaoButtonText}
          icon={<Ionicons name="chatbubble" size={18} color="#191919" />}
        />

        <SocialOAuthButton
          provider="google"
          label={googleLabel}
          loading={oauthLoading === 'google'}
          disabled={busy}
          onPress={() => void handleOAuth('google')}
          style={styles.googleButton}
          textStyle={styles.googleButtonText}
          icon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
        />
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function AuthDivider() {
  return (
    <View className="my-6 flex-row items-center">
      <View className="h-px flex-1 bg-kemix-elevated" />
      <Text className="mx-3 text-xs text-kemix-muted">또는 이메일로 계속</Text>
      <View className="h-px flex-1 bg-kemix-elevated" />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHint: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  buttonStack: {
    width: '100%',
    gap: BUTTON_GAP,
  },
  buttonBase: {
    width: '100%',
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    left: ICON_INSET_LEFT,
    justifyContent: 'center',
    alignItems: 'center',
    height: BUTTON_HEIGHT,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kakaoButtonText: {
    color: '#191919',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: {
    color: '#374151',
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    color: '#dc2626',
  },
});
