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
import { BRAND_NAME, BRAND_NAME_KO } from '@/constants/branding';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

function validatePassword(password: string): string | null {
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  return null;
}

function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return '올바른 휴대폰 번호를 입력해 주세요.';
  }
  return null;
}

export function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('입력 오류', '모든 항목을 입력해 주세요.');
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      Alert.alert('입력 오류', phoneError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('입력 오류', passwordError);
      return;
    }

    if (password !== confirm) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
      });

      if (needsEmailConfirmation) {
        Alert.alert(
          '회원가입 완료',
          '가입 확인 메일을 발송했습니다. 메일함을 확인한 뒤 로그인해 주세요.',
          [{ text: '확인', onPress: () => navigation.navigate('Login') }],
        );
      } else {
        Alert.alert('회원가입 완료', '가입이 완료되었습니다.', [
          { text: '확인', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (e) {
      Alert.alert('회원가입 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
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
          <Pressable className="mb-6 flex-row items-center" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
            <Text className="ml-2 font-semibold text-slate-900">로그인으로</Text>
          </Pressable>

          <View className="mb-6 items-center">
            <View className="mb-3 flex-row items-end gap-2">
              <Text className="text-2xl font-black tracking-tight text-slate-900">{BRAND_NAME}</Text>
              <Text className="pb-0.5 text-sm font-semibold text-emerald-700">{BRAND_NAME_KO}</Text>
            </View>
            <Text className="text-center text-xl font-bold text-slate-900">회원가입</Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
              이메일과 비밀번호로 KEMIX 계정을 만듭니다.
            </Text>
          </View>

          <SocialLoginButtons kakaoLabel="카카오로 시작하기" googleLabel="구글로 시작하기" />

          <AuthDivider />

          <Text className="mb-1 text-sm font-medium text-slate-700">이름</Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor="#94a3b8"
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">전화번호 (휴대폰 번호)</Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
            value={phone}
            onChangeText={setPhone}
            placeholder="01012345678"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">이메일</Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">비밀번호</Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
            value={password}
            onChangeText={setPassword}
            placeholder="8자 이상"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">비밀번호 확인</Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="비밀번호 재입력"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />

          <Text className="mb-4 text-xs leading-5 text-slate-500">
            가입 후 커뮤니티용 별명은 프로필 설정에서 등록할 수 있습니다.
          </Text>

          <Pressable
            className={`items-center rounded-xl py-4 ${loading ? 'bg-slate-400' : 'bg-slate-900'}`}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">가입하기</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
