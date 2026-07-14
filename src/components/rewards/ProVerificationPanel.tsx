import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import type { EmtVerification } from '@/lib/supabaseClient';
import {
  fetchLatestVerification,
  getRoleFromInvitationCode,
  isValidInvitationCode,
  submitVerificationRequest,
  uploadVerificationDocument,
} from '@/services/verificationService';
import { getRoleLabel } from '@/utils/roleAccess';

export function ProVerificationPanel() {
  const { user, profile, refreshProfile } = useAuth();
  const { isExpert, isApproved, canAccessHidden } = useUserRole();
  const [invitationCode, setInvitationCode] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<EmtVerification | null>(null);

  const loadVerification = useCallback(async () => {
    if (!user) return;
    const v = await fetchLatestVerification(user.id);
    setVerification(v);
  }, [user]);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

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

  const handleSubmit = async () => {
    if (!user) return;
    if (!invitationCode.trim()) {
      Alert.alert('입력 오류', '초대장 코드를 입력해 주세요.');
      return;
    }
    if (!imageUri) {
      Alert.alert('입력 오류', '자격증 이미지를 업로드해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const documentUrl = await uploadVerificationDocument(user.id, imageUri);
      const result = await submitVerificationRequest(user.id, invitationCode, documentUrl);
      setVerification(result);
      await refreshProfile();
      const targetRole = getRoleFromInvitationCode(invitationCode);
      if (isValidInvitationCode(invitationCode) && targetRole) {
        Alert.alert(
          '승인 완료',
          `테스트 초대 코드로 ${getRoleLabel(targetRole)} 계정이 활성화되었습니다.`,
        );
      } else {
        Alert.alert(
          '제출 완료',
          '자격증 심사가 접수되었습니다. 관리자 승인 후 전용 화면으로 전환됩니다.',
        );
      }
    } catch (e) {
      Alert.alert(
        '제출 실패',
        e instanceof Error ? e.message : 'Storage/DB 설정을 확인해 주세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (canAccessHidden) {
    return (
      <View className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
          <Text className="ml-2 text-base font-bold text-green-800">전문가 인증 완료</Text>
        </View>
        <Text className="mt-2 text-sm text-green-700">
          {getRoleLabel(profile?.role ?? 'user')} 승인이 완료되었습니다. 전용 대시보드를 이용할
          수 있습니다.
        </Text>
        {profile?.invitation_code ? (
          <Text className="mt-1 text-xs text-green-600">초대 코드: {profile.invitation_code}</Text>
        ) : null}
      </View>
    );
  }

  if (isExpert && !isApproved) {
    return (
      <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <View className="flex-row items-center">
          <Ionicons name="time" size={24} color="#d97706" />
          <Text className="ml-2 text-base font-bold text-amber-800">관리자 승인 대기 중</Text>
        </View>
        <Text className="mt-2 text-sm text-amber-700">
          {getRoleLabel(profile?.role ?? 'user')} 계정 승인을 기다리고 있습니다.
        </Text>
      </View>
    );
  }

  if (verification?.status === 'pending') {
    return (
      <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <View className="flex-row items-center">
          <Ionicons name="time" size={24} color="#d97706" />
          <Text className="ml-2 text-base font-bold text-amber-800">심사 대기 중</Text>
        </View>
        <Text className="mt-2 text-sm text-amber-700">
          자격증이 제출되었습니다. 관리자 승인 후 전용 화면이 활성화됩니다.
        </Text>
        <Text className="mt-1 text-xs text-amber-600">제출일: {verification.updated_at}</Text>
      </View>
    );
  }

  if (verification?.status === 'rejected') {
    return (
      <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <Text className="text-base font-bold text-red-800">인증 거절됨</Text>
        {verification.reviewer_notes ? (
          <Text className="mt-1 text-sm text-red-700">{verification.reviewer_notes}</Text>
        ) : null}
        <Text className="mt-2 text-xs text-red-600">아래에서 다시 신청할 수 있습니다.</Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center">
        <Ionicons name="shield-outline" size={22} color="#0f172a" />
        <Text className="ml-2 text-base font-bold text-slate-900">전문가 채널 인증 신청</Text>
      </View>
      <Text className="mt-2 text-sm leading-5 text-slate-500">
        초대장 코드와 자격증을 제출하면 전문가 전용 화면이 열립니다.
        {'\n'}테스트 코드: EMS-TEST-PRO (구조사), HOSP-TEST-2026 (병원), PRIVATE-EMS-TEST (사설
        구급차)
      </Text>

      <Text className="mb-1 mt-4 text-sm font-medium text-slate-700">초대장 코드</Text>
      <TextInput
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base"
        value={invitationCode}
        onChangeText={setInvitationCode}
        placeholder="EMS-TEST-PRO"
        placeholderTextColor="#94a3b8"
        autoCapitalize="characters"
      />

      <Text className="mb-1 mt-4 text-sm font-medium text-slate-700">자격증 이미지</Text>
      <Pressable
        className="items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-6"
        onPress={pickImage}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="h-32 w-full rounded-lg" resizeMode="contain" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={32} color="#94a3b8" />
            <Text className="mt-2 text-sm text-slate-500">갤러리에서 선택</Text>
          </>
        )}
      </Pressable>

      <Pressable
        className={`mt-4 items-center rounded-xl py-3 ${loading ? 'bg-slate-400' : 'bg-blue-600'}`}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-bold text-white">인증 신청 제출</Text>
        )}
      </Pressable>
    </View>
  );
}
