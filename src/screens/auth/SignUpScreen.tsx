import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useAuth } from '@/contexts/AuthContext';
import type { AuthStackParamList } from '@/navigation/AuthStack';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('입력 오류', '모든 항목을 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      Alert.alert(
        '회원가입 완료',
        '가입이 완료되었습니다. 이메일 인증이 필요한 경우 메일함을 확인해 주세요.',
        [{ text: '확인', onPress: () => navigation.navigate('Login') }],
      );
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
        <ScrollView contentContainerClassName="px-6 py-8">
          <Pressable className="mb-6 flex-row items-center" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
            <Text className="ml-2 font-semibold text-slate-900">로그인으로</Text>
          </Pressable>

          <Text className="text-2xl font-bold text-slate-900">회원가입</Text>
          <Text className="mt-2 text-sm text-slate-500">
            가입 시 기본 역할은 일반인(public)입니다.
          </Text>

          <Text className="mb-1 mt-6 text-sm font-medium text-slate-700">이름</Text>
          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor="#94a3b8"
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
            placeholder="6자 이상"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />

          <Text className="mb-1 text-sm font-medium text-slate-700">비밀번호 확인</Text>
          <TextInput
            className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="비밀번호 재입력"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />

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
