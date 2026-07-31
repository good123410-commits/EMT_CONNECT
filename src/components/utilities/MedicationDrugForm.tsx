import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { UtilityFormField } from '@/components/utilities/UtilityFormField';
import type { MedicationDrugSlot } from '@/types/medicationLog';

type MedicationDrugFormProps = {
  title: string;
  slot: MedicationDrugSlot;
  onChange: (patch: Partial<MedicationDrugSlot>) => void;
  onDelete?: () => void;
  showDelete?: boolean;
};

export function MedicationDrugForm({
  title,
  slot,
  onChange,
  onDelete,
  showDelete = false,
}: MedicationDrugFormProps) {
  const pickPhoto = async (source: 'library' | 'camera') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        onChange({ photoUri: result.assets[0].uri });
      }
      return;
    }

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
      onChange({ photoUri: result.assets[0].uri });
    }
  };

  return (
    <View className="rounded-xl border border-kemix-border-light bg-kemix-bg/60 p-3">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-bold text-kemix-text">{title}</Text>
        {showDelete && onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="약물 삭제"
            className="h-8 w-8 items-center justify-center rounded-full bg-kemix-surface active:bg-red-50"
            onPress={onDelete}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </Pressable>
        ) : null}
      </View>

      <Text className="mb-2 text-sm font-semibold text-kemix-text">사진 첨부 (선택)</Text>
      <View className="mb-3 flex-row gap-2">
        <Pressable
          className="flex-1 items-center rounded-xl border border-kemix-border bg-kemix-surface py-3 active:bg-kemix-elevated"
          onPress={() => void pickPhoto('library')}
        >
          <Ionicons name="images-outline" size={22} color="#64748b" />
          <Text className="mt-1 text-xs font-semibold text-kemix-text-secondary">갤러리</Text>
        </Pressable>
        <Pressable
          className="flex-1 items-center rounded-xl border border-kemix-border bg-kemix-surface py-3 active:bg-kemix-elevated"
          onPress={() => void pickPhoto('camera')}
        >
          <Ionicons name="camera-outline" size={22} color="#64748b" />
          <Text className="mt-1 text-xs font-semibold text-kemix-text-secondary">카메라</Text>
        </Pressable>
      </View>
      {slot.photoUri ? (
        <Image
          source={{ uri: slot.photoUri }}
          className="mb-3 h-36 w-full rounded-xl"
          resizeMode="cover"
        />
      ) : (
        <View className="mb-3 h-24 items-center justify-center rounded-xl border border-dashed border-kemix-border bg-kemix-surface">
          <Text className="text-xs text-kemix-muted">약봉투·처방전 사진</Text>
        </View>
      )}

      <UtilityFormField
        label="약 이름"
        placeholder="예: 타이레놀시럽, 부루펜시럽"
        value={slot.drugName}
        onChangeText={(text) => onChange({ drugName: text })}
      />
      <UtilityFormField
        label="1회 복용량"
        placeholder="예: 5mL, 1정"
        value={slot.dosePerServing}
        onChangeText={(text) => onChange({ dosePerServing: text })}
      />
    </View>
  );
}
