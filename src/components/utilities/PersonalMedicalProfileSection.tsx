import { useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';
import {
  persistMedicalProfile,
  loadStoredMedicalProfile,
  LOCAL_GUEST_MEDICAL_USER_ID,
} from '@/services/medicalProfileStorage';
import {
  createEmptyUserMedicalProfile,
  type UserMedicalProfile,
  type UserMedicalProfileInput,
} from '@/types/userMedicalProfile';

type PersonalMedicalProfileSectionProps = {
  userId?: string | null;
  showPrivacyNote?: boolean;
};

function MedicalField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-kemix-text">{label}</Text>
      <TextInput
        className={`rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text ${
          multiline ? 'min-h-[96px]' : ''
        }`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export function PersonalMedicalProfileSection({
  userId,
  showPrivacyNote = true,
}: PersonalMedicalProfileSectionProps) {
  const effectiveUserId = userId ?? LOCAL_GUEST_MEDICAL_USER_ID;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserMedicalProfile>(() =>
    createEmptyUserMedicalProfile(effectiveUserId),
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadStoredMedicalProfile(userId)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(createEmptyUserMedicalProfile(effectiveUserId));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, effectiveUserId]);

  const updateField = <K extends keyof UserMedicalProfileInput>(key: K, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await persistMedicalProfile(userId, {
        chronicConditions: profile.chronicConditions,
        medications: profile.medications,
        allergies: profile.allergies,
        emergencyContact1Name: profile.emergencyContact1Name,
        emergencyContact1Phone: profile.emergencyContact1Phone,
        emergencyContact2Name: profile.emergencyContact2Name,
        emergencyContact2Phone: profile.emergencyContact2Phone,
        medicalNotes: profile.medicalNotes,
        preferredHospital: profile.preferredHospital,
      });
      setProfile(saved);
      Alert.alert(
        '저장 완료',
        userId
          ? '개인 의료정보가 계정과 기기에 안전하게 저장되었습니다.'
          : '개인 의료정보가 이 기기에 저장되었습니다. 로그인 시 계정에도 동기화됩니다.',
      );
    } catch (error) {
      Alert.alert(
        '저장 실패',
        error instanceof Error ? error.message : '개인 의료정보 저장에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color="#2563eb" />
        <Text className="mt-2 text-sm text-kemix-muted">의료정보 불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View>
      {showPrivacyNote ? (
        <View className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <Text className="text-xs leading-5 text-amber-900">
            아래 정보는 119·112 긴급 신고 시 GPS 위치와 함께 문자로 전달됩니다. 기기에 저장되며,
            로그인 시 계정에도 동기화됩니다.
          </Text>
        </View>
      ) : null}

      <MedicalField
        label="기저질환"
        placeholder="예: 당뇨, 고혈압, 심장질환"
        value={profile.chronicConditions}
        onChangeText={(text) => updateField('chronicConditions', text)}
        multiline
      />
      <MedicalField
        label="복용 약물"
        placeholder="현재 복용 중인 약물"
        value={profile.medications}
        onChangeText={(text) => updateField('medications', text)}
        multiline
      />
      <MedicalField
        label="알레르기"
        placeholder="약물·음식 알레르기"
        value={profile.allergies}
        onChangeText={(text) => updateField('allergies', text)}
        multiline
      />
      <MedicalField
        label="비상연락망 1 · 이름"
        placeholder="보호자/가족 이름"
        value={profile.emergencyContact1Name}
        onChangeText={(text) => updateField('emergencyContact1Name', text)}
      />
      <MedicalField
        label="비상연락망 1 · 전화번호"
        placeholder="010-0000-0000"
        value={profile.emergencyContact1Phone}
        onChangeText={(text) => updateField('emergencyContact1Phone', text)}
      />
      <MedicalField
        label="비상연락망 2 · 이름"
        placeholder="추가 연락처 이름"
        value={profile.emergencyContact2Name}
        onChangeText={(text) => updateField('emergencyContact2Name', text)}
      />
      <MedicalField
        label="비상연락망 2 · 전화번호"
        placeholder="010-0000-0000"
        value={profile.emergencyContact2Phone}
        onChangeText={(text) => updateField('emergencyContact2Phone', text)}
      />
      <MedicalField
        label="선호 응급 병원"
        placeholder="응급실 선호 병원"
        value={profile.preferredHospital}
        onChangeText={(text) => updateField('preferredHospital', text)}
      />
      <MedicalField
        label="응급 의료 메모"
        placeholder="보험, 특이사항, 기타 전달 사항"
        value={profile.medicalNotes}
        onChangeText={(text) => updateField('medicalNotes', text)}
        multiline
      />

      <Pressable
        className={`mt-1 items-center rounded-xl py-3.5 ${saving ? 'bg-blue-300' : 'bg-blue-600 active:bg-blue-700'}`}
        disabled={saving}
        onPress={() => void handleSave()}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-bold text-white">의료정보 저장</Text>
        )}
      </Pressable>
    </View>
  );
}
