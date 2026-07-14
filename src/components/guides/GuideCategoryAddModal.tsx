import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GUIDE_ICON_OPTIONS, DEFAULT_GUIDE_ICON, type GuideIconId } from '@/constants/guideIcons';
import { createGuideCategory, type GuideCategory } from '@/services/guideCategoryService';

type GuideCategoryAddModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (category: GuideCategory) => void;
};

export function GuideCategoryAddModal({
  visible,
  onClose,
  onCreated,
}: GuideCategoryAddModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<GuideIconId>(DEFAULT_GUIDE_ICON);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setIcon(DEFAULT_GUIDE_ICON);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const category = await createGuideCategory(name, icon);
      resetForm();
      onCreated(category);
      onClose();
      Alert.alert('추가 완료', `"${category.name}" 분류가 등록되었습니다.`);
    } catch (err) {
      Alert.alert('추가 실패', err instanceof Error ? err.message : '다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            className="rounded-t-3xl bg-white"
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={(event) => event.stopPropagation()}
          >
            <View className="border-b border-slate-200 px-4 py-4">
              <Text className="text-center text-base font-bold text-slate-900">새 분류 추가</Text>
            </View>

            <View className="px-4 py-4">
              <Text className="mb-1 text-sm font-medium text-slate-700">분류 이름</Text>
              <TextInput
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
                value={name}
                onChangeText={setName}
                placeholder="예: 알레르기, 독극물"
                placeholderTextColor="#94a3b8"
              />

              <Text className="mb-2 text-sm font-medium text-slate-700">아이콘 선택</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {GUIDE_ICON_OPTIONS.map((option) => {
                  const selected = icon === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      className={`items-center rounded-xl border px-3 py-2 ${
                        selected ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'
                      }`}
                      onPress={() => setIcon(option.id)}
                    >
                      <Ionicons
                        name={option.id}
                        size={22}
                        color={selected ? '#dc2626' : '#64748b'}
                      />
                      <Text
                        className={`mt-1 text-[10px] ${selected ? 'font-bold text-red-600' : 'text-slate-500'}`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                className={`items-center rounded-xl py-4 ${saving ? 'bg-slate-400' : 'bg-red-600'}`}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-bold text-white">분류 추가하기</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
