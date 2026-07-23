import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthDivider, SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { BRAND_FULL_NAME, BRAND_NAME, BRAND_NAME_KO } from '@/constants/branding';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import { returnToGuestMain } from '@/navigation/rootNavigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      Alert.alert('로그인 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="px-6 py-8" keyboardShouldPersistTaps="handled">
          <View className="mb-6 items-center">
            <View className="mb-3 flex-row items-end gap-2">
              <Text className="text-2xl font-black tracking-tight text-slate-900">{BRAND_NAME}</Text>
              <Text className="pb-0.5 text-sm font-semibold text-emerald-700">{BRAND_NAME_KO}</Text>
            </View>
            <Text className="text-center text-xl font-bold text-slate-900">로그인</Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
              {BRAND_NAME} 계정으로 로그인하세요.
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-400">{BRAND_FULL_NAME}</Text>
          </View>

          <SocialLoginButtons kakaoLabel="카카오로 시작하기" googleLabel="Google 계정으로 로그인" />

          <AuthDivider />

          <Text className="mb-1 text-sm font-medium text-slate-700">이메일</Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">비밀번호</Text>
          <TextInput
            className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />

          <Pressable
            className={`items-center rounded-xl py-4 ${loading ? 'bg-slate-400' : 'bg-slate-900'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">로그인</Text>
            )}
          </Pressable>

          <Pressable
            className="mt-4 items-center py-2"
            onPress={() => navigation.navigate('SignUp')}
            accessibilityRole="button"
          >
            <Text className="text-sm text-slate-600">
              계정이 없으신가요?{' '}
              <Text className="font-semibold text-slate-900">회원가입</Text>
            </Text>
          </Pressable>

          <Pressable className="mt-2 items-center py-2" onPress={returnToGuestMain}>
            <Text className="text-sm font-medium text-slate-500">둘러보기 (로그인 없이)</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
