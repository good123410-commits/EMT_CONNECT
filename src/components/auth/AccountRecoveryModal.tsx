import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  findMaskedEmailByNamePhone,
  getPasswordResetErrorMessage,
  sendPasswordResetEmail,
} from '@/services/accountRecoveryService';

export type AccountRecoveryMode = 'find-id' | 'find-password';

type AccountRecoveryModalProps = {
  visible: boolean;
  mode: AccountRecoveryMode;
  onClose: () => void;
};

export function AccountRecoveryModal({ visible, mode, onClose }: AccountRecoveryModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const isFindId = mode === 'find-id';

  useEffect(() => {
    if (!visible) return;
    setName('');
    setPhone('');
    setEmail('');
    setLoading(false);
    setError(null);
    setSuccess(null);
    setMaskedEmail(null);
  }, [visible, mode]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleFindId = async () => {
    setError(null);
    setSuccess(null);
    setMaskedEmail(null);

    if (!name.trim() || !phone.trim()) {
      setError('이름과 휴대전화번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const hint = await findMaskedEmailByNamePhone(name, phone);
      if (!hint) {
        setError('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.');
        return;
      }
      setMaskedEmail(hint);
      setSuccess('가입된 이메일 주소입니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '아이디 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('가입 시 사용한 이메일을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      setSuccess(
        '비밀번호 재설정 안내 메일을 발송했습니다. 메일함(스팸함 포함)을 확인해 주세요.',
      );
    } catch (err) {
      setError(getPasswordResetErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const title = isFindId ? '아이디 찾기' : '비밀번호 찾기';
  const description = isFindId
    ? '가입 시 등록한 이름과 휴대전화번호로 이메일 일부를 확인할 수 있습니다.'
    : '가입 이메일로 비밀번호 재설정 링크를 보내 드립니다.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable className="flex-1 justify-end bg-black/50 sm:items-center sm:justify-center" onPress={handleClose}>
        <Pressable
          className="max-h-[90%] w-full rounded-t-2xl bg-kemix-surface p-5 sm:max-w-md sm:rounded-2xl"
          onPress={(event) => event.stopPropagation()}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
              <View className="mb-1 flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-kemix-text">{title}</Text>
                  <Text className="mt-1 text-sm leading-5 text-kemix-text-secondary">{description}</Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                  className="rounded-full px-2 py-1"
                >
                  <Text className="text-xl leading-none text-kemix-muted">×</Text>
                </Pressable>
              </View>

              {isFindId ? (
                <View className="mt-4">
                  <Text className="mb-1 text-sm font-medium text-kemix-text">이름</Text>
                  <TextInput
                    className="mb-3 rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                    value={name}
                    onChangeText={setName}
                    placeholder="홍길동"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  <Text className="mb-1 text-sm font-medium text-kemix-text">휴대전화번호</Text>
                  <TextInput
                    className="mb-3 rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="01012345678"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
              ) : (
                <View className="mt-4">
                  <Text className="mb-1 text-sm font-medium text-kemix-text">이메일</Text>
                  <TextInput
                    className="mb-3 rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              )}

              {error ? (
                <Text className="mb-2 text-sm text-red-600" accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}

              {success ? (
                <View className="mb-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                  <Text className="text-sm text-emerald-800" accessibilityRole="text">
                    {success}
                  </Text>
                  {maskedEmail ? (
                    <Text className="mt-1 text-base font-bold text-emerald-900">{maskedEmail}</Text>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                className={`mt-2 items-center rounded-xl py-3.5 ${loading ? 'bg-slate-400' : 'bg-slate-900'}`}
                disabled={loading}
                onPress={() => void (isFindId ? handleFindId() : handleResetPassword())}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-bold text-white">
                    {isFindId ? '아이디 확인' : '재설정 메일 보내기'}
                  </Text>
                )}
              </Pressable>

              <Pressable className="mt-3 items-center py-2" onPress={handleClose} disabled={loading}>
                <Text className="text-sm font-medium text-kemix-text-secondary">닫기</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
