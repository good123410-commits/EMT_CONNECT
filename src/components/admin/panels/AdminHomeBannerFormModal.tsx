import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import { uploadHomeBannerImage } from '@/services/homeBannerService';
import type { HomeBanner } from '@/types/homeDashboard';

export type HomeBannerFormValues = {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: HomeBannerFormValues = {
  title: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  isActive: true,
};

type AdminHomeBannerFormModalProps = {
  visible: boolean;
  editing: HomeBanner | null;
  onClose: () => void;
  onSubmit: (values: HomeBannerFormValues) => Promise<void>;
};

export function AdminHomeBannerFormModal({
  visible,
  editing,
  onClose,
  onSubmit,
}: AdminHomeBannerFormModalProps) {
  const [form, setForm] = useState<HomeBannerFormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editingId = editing?.id ?? null;

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description,
        imageUrl: editing.imageUrl ?? '',
        linkUrl: editing.linkUrl,
        isActive: editing.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [visible, editingId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const url = await uploadHomeBannerImage(asset.uri, asset.mimeType ?? 'image/jpeg');
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-kemix-bg"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <Text className="text-lg font-bold text-kemix-text">
            {editing ? '배너 수정' : '배너 추가'}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="p-4 pb-10">
          <AdminFormField
            label="제목"
            value={form.title}
            onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))}
            placeholder="이벤트 제목"
          />
          <AdminFormField
            label="설명"
            value={form.description}
            onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
            placeholder="한 줄 설명"
            multiline
          />
          <AdminFormField
            label="링크 URL"
            value={form.linkUrl}
            onChangeText={(text) => setForm((prev) => ({ ...prev, linkUrl: text }))}
            placeholder="https://..."
          />
          <AdminFormField
            label="이미지 URL"
            value={form.imageUrl}
            onChangeText={(text) => setForm((prev) => ({ ...prev, imageUrl: text }))}
            placeholder="https://... (선택)"
          />

          <Pressable
            className="mb-4 flex-row items-center justify-center rounded-xl border border-violet-200 bg-violet-50 py-3 active:bg-violet-100"
            onPress={() => void pickImage()}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#7c3aed" />
            ) : (
              <>
                <Ionicons name="image-outline" size={18} color="#7c3aed" />
                <Text className="ml-2 text-sm font-semibold text-violet-800">
                  갤러리에서 이미지 업로드
                </Text>
              </>
            )}
          </Pressable>

          {form.imageUrl ? (
            <Image
              source={{ uri: form.imageUrl }}
              style={{ width: '100%', height: 120, borderRadius: 12, marginBottom: 16 }}
              resizeMode="cover"
            />
          ) : null}

          <View className="mb-4 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3">
            <Text className="text-sm font-semibold text-kemix-text">앱에 노출</Text>
            <Switch
              value={form.isActive}
              onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
            />
          </View>

          <Pressable
            className={`items-center rounded-xl py-3.5 ${submitting ? 'bg-violet-300' : 'bg-violet-600'}`}
            disabled={submitting}
            onPress={() => void handleSave()}
          >
            <Text className="font-bold text-white">{submitting ? '저장 중…' : '저장'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
