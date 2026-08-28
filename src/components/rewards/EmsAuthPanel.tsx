import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Image, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchLatestVerification,
  submitEmsDocumentRequest,
  submitVerificationCode,
  uploadVerificationDocument,
} from '@/services/verificationService';
import type { EmtVerification } from '@/lib/supabaseClient';
import { resolveEmsAuthStatus, type EmsAuthStatus } from '@/utils/emsAuthStatus';
import { getRoleLabel } from '@/utils/roleAccess';

type Props = {
  onVerified?: () => void;
};

export function EmsAuthPanel({ onVerified }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [invitationCode, setInvitationCode] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<EmtVerification | null>(null);

  const authStatus: EmsAuthStatus = resolveEmsAuthStatus(profile, verification);

  const loadVerification = useCallback(async () => {
    if (!user) return;
    const row = await fetchLatestVerification(user.id);
    setVerification(row);
  }, [user]);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification, profile?.auth_status, profile?.is_approved, profile?.role]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleDocumentSubmit = async () => {
    if (!user) return;
    if (!imageUri) {
      Alert.alert('입력 오류', '자격증 이미지를 업로드해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const documentUrl = await uploadVerificationDocument(user.id, imageUri);
      const result = await submitEmsDocumentRequest(documentUrl);
      setVerification(result);
      await refreshProfile();
      setImageUri(null);
      Alert.alert('제출 완료', 'EMS 인증 승인 요청이 접수되었습니다.');
    } catch (error) {
      Alert.alert(
        '제출 실패',
        error instanceof Error ? error.message : '인증 요청에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!user) return;
    if (!invitationCode.trim()) {
      Alert.alert('입력 오류', '비밀코드를 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await submitVerificationCode(invitationCode);
      setVerification(result);
      await refreshProfile();
      setInvitationCode('');
      Alert.alert('인증 완료', 'EMS 전용 공간과 커뮤니티를 이용할 수 있습니다.');
      onVerified?.();
    } catch (error) {
      Alert.alert(
        '인증 실패',
        error instanceof Error ? error.message : '비밀코드 인증에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === 'verified') {
    return (
      <View className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
          <Text className="ml-2 text-base font-bold text-green-800">EMS 인증 완료</Text>
        </View>
        <Text className="mt-2 text-sm text-green-700">
          {getRoleLabel(profile?.role ?? 'user')} 승인이 완료되었습니다. EMS 전용 공간을 이용할
          수 있습니다.
        </Text>
      </View>
    );
  }

  if (authStatus === 'pending') {
    return (
      <View className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={26} color="#d97706" />
          <Text className="ml-2 text-base font-bold text-amber-900">승인 대기 중</Text>
        </View>
        <Text className="mt-3 text-sm leading-6 text-amber-800">
          관리자가 자격증을 검토 중입니다. 승인 후 이메일로 비밀코드가 전송됩니다.
        </Text>
        {verification?.updated_at ? (
          <Text className="mt-2 text-xs text-amber-600">
            요청일: {new Date(verification.updated_at).toLocaleString('ko-KR')}
          </Text>
        ) : null}
      </View>
    );
  }

  if (authStatus === 'code_required') {
    return (
      <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
        <Text className="text-base font-bold text-kemix-text">비밀코드 입력</Text>
        <Text className="mt-2 text-sm leading-5 text-kemix-text-secondary">
          이메일로 받은 EMS 비밀코드를 입력하면 전용 공간이 열립니다.
        </Text>

        <Text className="mb-1 mt-4 text-sm font-medium text-kemix-text">비밀코드</Text>
        <TextInput
          className="rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base"
          value={invitationCode}
          onChangeText={setInvitationCode}
          placeholder="비밀코드 입력"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
        />

        <Pressable
          className={`mt-4 items-center rounded-xl py-3.5 ${loading ? 'bg-slate-400' : 'bg-blue-600'}`}
          onPress={() => void handleCodeSubmit()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-bold text-white">입력 완료 · 인증</Text>
          )}
        </Pressable>
      </View>
    );
  }

  if (verification?.status === 'rejected' && authStatus === 'none') {
    return (
      <View>
        <View className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <Text className="text-base font-bold text-red-800">인증 거절됨</Text>
          {verification.reviewer_notes ? (
            <Text className="mt-1 text-sm text-red-700">{verification.reviewer_notes}</Text>
          ) : null}
          <Text className="mt-2 text-xs text-red-600">아래에서 다시 신청할 수 있습니다.</Text>
        </View>
        <EmsApplicationForm
          imageUri={imageUri}
          loading={loading}
          onPickImage={() => void pickImage()}
          onSubmit={() => void handleDocumentSubmit()}
        />
      </View>
    );
  }

  return (
    <EmsApplicationForm
      imageUri={imageUri}
      loading={loading}
      onPickImage={() => void pickImage()}
      onSubmit={() => void handleDocumentSubmit()}
    />
  );
}

function EmsApplicationForm({
  imageUri,
  loading,
  onPickImage,
  onSubmit,
}: {
  imageUri: string | null;
  loading: boolean;
  onPickImage: () => void;
  onSubmit: () => void;
}) {
  return (
    <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
      <View className="flex-row items-center">
        <Ionicons name="shield-outline" size={22} color="#0f172a" />
        <Text className="ml-2 text-base font-bold text-kemix-text">EMS 인증 신청</Text>
      </View>
      <Text className="mt-2 text-sm leading-5 text-kemix-text-secondary">
        응급구조사 자격증을 제출하면 관리자 검토 후 비밀코드가 이메일로 발송됩니다.
      </Text>

      <Text className="mb-1 mt-4 text-sm font-medium text-kemix-text">자격증 이미지</Text>
      <Pressable
        className="items-center rounded-xl border-2 border-dashed border-kemix-border bg-kemix-bg py-6"
        onPress={onPickImage}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="h-32 w-full rounded-lg" resizeMode="contain" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={32} color="#94a3b8" />
            <Text className="mt-2 text-sm text-kemix-text-secondary">갤러리에서 선택</Text>
          </>
        )}
      </Pressable>
      <Text className="mt-2 text-xs leading-5 text-kemix-muted">
        (주민번호, 자격번호 등 개인정보를 가리고 찍어주세요. 수집된 이미지는 확인 후 즉시
        파기됩니다.)
      </Text>

      <Pressable
        className={`mt-4 items-center rounded-xl py-3.5 ${loading ? 'bg-slate-400' : 'bg-blue-600'}`}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-bold text-white">인증 승인 요청</Text>
        )}
      </Pressable>
    </View>
  );
}