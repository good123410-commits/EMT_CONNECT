import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { EmergencyInfoCardContent } from '@/components/utilities/EmergencyInfoCardContent';
import { EmergencyLockScreenGuideCard } from '@/components/utilities/EmergencyLockScreenGuideCard';
import { EmergencyQuickViewOverlay } from '@/components/utilities/EmergencyQuickViewOverlay';
import { EmergencyOverlayToggleCard } from '@/components/utilities/EmergencyOverlayToggleCard';
import { EmergencyWallpaperSection } from '@/components/utilities/EmergencyWallpaperSection';
import { UtilityFormField } from '@/components/utilities/UtilityFormField';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';
import {
  loadEmergencyContactCard,
  saveEmergencyContactCard,
} from '@/services/emergencyContactStorage';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
import { hasEmergencyCardContent } from '@/utils/emergencyCardEncoding';

export function EmergencyContactCardScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmergencyContactCardData | null>(null);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [quickViewMode, setQuickViewMode] = useState<'quick' | 'wallpaper'>('quick');

  const openQuickView = useCallback((mode: 'quick' | 'wallpaper' = 'quick') => {
    setQuickViewMode(mode);
    setQuickViewVisible(true);
  }, []);

  useEffect(() => {
    void loadEmergencyContactCard().then((card) => {
      setData(card);
      setLoading(false);
    });
  }, []);

  const updateField = <K extends keyof EmergencyContactCardData>(
    key: K,
    value: EmergencyContactCardData[K],
  ) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!data) return;
    await saveEmergencyContactCard(data);
    Alert.alert('저장 완료', '응급 의료 정보가 저장되었습니다.');
  };

  const handleTestQuickView = () => {
    if (!data || !hasEmergencyCardContent(data)) {
      Alert.alert('정보 입력', '미리보기를 위해 응급 정보를 먼저 입력해 주세요.');
      return;
    }
    openQuickView('quick');
  };

  const handleWallpaperPreview = () => {
    if (!data || !hasEmergencyCardContent(data)) {
      Alert.alert('정보 입력', '배경화면 미리보기를 위해 응급 정보를 먼저 입력해 주세요.');
      return;
    }
    openQuickView('wallpaper');
  };

  const handleInstantActivate = async () => {
    if (!data) return;
    await saveEmergencyContactCard(data);
    if (!hasEmergencyCardContent(data)) {
      Alert.alert('정보 입력', '이름 또는 비상 연락처를 입력해 주세요.');
      return;
    }
    openQuickView('quick');
  };

  if (loading || !data) {
    return (
      <UtilityToolShell>
        <Text className="text-center text-sm text-kemix-text-secondary">불러오는 중…</Text>
      </UtilityToolShell>
    );
  }

  return (
    <UtilityToolShell>
      <Pressable
        className="mb-4 flex-row items-center justify-center rounded-xl bg-red-600 py-3.5 active:bg-red-700"
        onPress={() => void handleInstantActivate()}
      >
        <Ionicons name="flash" size={18} color="#fff" />
        <Text className="ml-2 text-base font-bold text-white">즉시 저장 및 응급 카드 표시</Text>
      </Pressable>

      <View className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4">
        <Text className="text-sm leading-6 text-red-900">
          가족·지인 비상 연락처, 알레르기, 복용 약물, 응급실 선호 병원 등을 저장하고 현장에서
          빠르게 확인할 수 있습니다.
        </Text>
      </View>

      <UtilityFormField
        label="이름"
        placeholder="본인 이름"
        value={data.fullName}
        onChangeText={(text) => updateField('fullName', text)}
      />
      <UtilityFormField
        label="비상 연락처 1"
        placeholder="이름"
        value={data.contact1Name}
        onChangeText={(text) => updateField('contact1Name', text)}
      />
      <UtilityFormField
        label="비상 연락처 1 · 전화번호"
        placeholder="010-0000-0000"
        value={data.contact1Phone}
        onChangeText={(text) => updateField('contact1Phone', text)}
      />
      <UtilityFormField
        label="비상 연락처 2"
        placeholder="이름"
        value={data.contact2Name}
        onChangeText={(text) => updateField('contact2Name', text)}
      />
      <UtilityFormField
        label="비상 연락처 2 · 전화번호"
        placeholder="010-0000-0000"
        value={data.contact2Phone}
        onChangeText={(text) => updateField('contact2Phone', text)}
      />
      <UtilityFormField
        label="알레르기 / 복용 약물"
        placeholder="알레르기, 만성질환, 복용 중인 약"
        multiline
        value={data.allergiesMedications}
        onChangeText={(text) => updateField('allergiesMedications', text)}
      />
      <UtilityFormField
        label="선호 응급 병원"
        placeholder="응급실 선호 병원"
        value={data.preferredHospital}
        onChangeText={(text) => updateField('preferredHospital', text)}
      />
      <UtilityFormField
        label="응급 의료 메모"
        placeholder="보험 정보, 특이사항"
        multiline
        value={data.medicalNotes}
        onChangeText={(text) => updateField('medicalNotes', text)}
      />

      <Pressable
        className="mb-5 items-center rounded-xl bg-red-600 py-3 active:bg-red-700"
        onPress={() => void handleSave()}
      >
        <Text className="font-bold text-white">응급 정보 저장</Text>
      </Pressable>

      <View className="mb-5 rounded-2xl border border-kemix-border bg-kemix-surface p-4">
        <Text className="text-sm font-semibold text-kemix-text">앱 내 전체 미리보기</Text>
        <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">
          편집 화면에서만 상세 정보가 보입니다. 잠금화면·숏컷·위젯에는 QR만 표시됩니다.
        </Text>
        <View className="mt-3">
          <EmergencyInfoCardContent data={data} />
        </View>
      </View>

      <View className="mb-5 gap-4">
        <Text className="text-sm font-bold text-kemix-text">잠금화면에서 빠르게 열기</Text>
        <Text className="text-xs leading-5 text-kemix-text-secondary">
          취향에 맞는 방법을 선택하세요. 숏컷·위젯으로 즉시 열기, 또는 배경화면으로 항상
          표시하기.
        </Text>
        <EmergencyLockScreenGuideCard onTestQuickView={handleTestQuickView} />
        <EmergencyWallpaperSection onOpenWallpaperPreview={handleWallpaperPreview} />
        <View className="mt-4">
          <EmergencyOverlayToggleCard />
        </View>
      </View>

      <EmergencyQuickViewOverlay
        visible={quickViewVisible}
        data={data}
        mode={quickViewMode}
        onClose={() => setQuickViewVisible(false)}
      />
    </UtilityToolShell>
  );
}
