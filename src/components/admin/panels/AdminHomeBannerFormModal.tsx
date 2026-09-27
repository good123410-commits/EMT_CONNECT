import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { AdminFormField } from '@/components/admin/AdminFormField';
import { uploadHomeBannerAsset } from '@/services/homeBannerService';
import type { HomeBanner, HomeBannerMediaType } from '@/types/homeDashboard';
import { homeBannerMediaLabel } from '@/utils/homeBannerMedia';

export type HomeBannerFormValues = {
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  mediaType: HomeBannerMediaType;
  linkUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: HomeBannerFormValues = {
  title: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  mediaType: 'image',
  linkUrl: '',
  isActive: true,
};

const MEDIA_TYPE_OPTIONS: { value: HomeBannerMediaType; label: string }[] = [
  { value: 'image', label: '이미지' },
  { value: 'gif', label: 'GIF' },
  { value: 'video', label: '영상' },
];

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
        videoUrl: editing.videoUrl ?? '',
        mediaType: editing.mediaType ?? 'image',
        linkUrl: editing.linkUrl,
        isActive: editing.isActive,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [visible, editingId]);

  const previewUri = useMemo(() => {
    if (form.mediaType === 'video') {
      return form.imageUrl.trim() || null;
    }
    return form.imageUrl.trim() || null;
  }, [form.imageUrl, form.mediaType]);

  const pickImageAsset = async (forGif: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: forGif ? ['images'] : ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const url = await uploadHomeBannerAsset(asset.uri, asset.mimeType ?? 'image/jpeg');
      setForm((prev) => ({
        ...prev,
        imageUrl: url,
        mediaType: forGif ? 'gif' : prev.mediaType === 'video' ? 'video' : 'image',
      }));
    } finally {
      setUploading(false);
    }
  };

  const pickVideoAsset = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const url = await uploadHomeBannerAsset(asset.uri, asset.mimeType ?? 'video/mp4');
      setForm((prev) => ({
        ...prev,
        videoUrl: url,
        mediaType: 'video',
      }));
    } finally {
      setUploading(false);
    }
  };

  const pickPosterForVideo = async () => {
    await pickImageAsset(false);
  };

  const handleSave = async () => {
    if (form.mediaType === 'video' && !form.videoUrl.trim()) {
      Alert.alert('영상 필요', '영상 URL을 입력하거나 갤러리에서 업로드해 주세요.');
      return;
    }
    if (form.mediaType !== 'video' && !form.imageUrl.trim()) {
      Alert.alert('미디어 필요', '이미지 또는 GIF URL을 입력하거나 업로드해 주세요.');
      return;
    }
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
          <Text className="mb-2 text-xs font-semibold text-kemix-text-secondary">미디어 유형</Text>
          <SegmentControl
            options={MEDIA_TYPE_OPTIONS}
            value={form.mediaType}
            onChange={(mediaType) => setForm((prev) => ({ ...prev, mediaType }))}
          />
          <Text className="mb-3 mt-2 text-[11px] leading-5 text-kemix-muted">
            {form.mediaType === 'video'
              ? '숏폼 MP4·MOV 권장. 썸네일(포스터) 이미지를 함께 올리면 로딩이 빨라집니다.'
              : form.mediaType === 'gif'
                ? 'GIF·움짤은 image_url에 저장됩니다.'
                : '정적 JPG·PNG 배너입니다.'}
          </Text>

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

          {form.mediaType === 'video' ? (
            <>
              <AdminFormField
                label="영상 URL"
                value={form.videoUrl}
                onChangeText={(text) => setForm((prev) => ({ ...prev, videoUrl: text }))}
                placeholder="https://...mp4"
              />
              <AdminFormField
                label="썸네일(포스터) URL"
                value={form.imageUrl}
                onChangeText={(text) => setForm((prev) => ({ ...prev, imageUrl: text }))}
                placeholder="https://...jpg (선택)"
              />
              <Pressable
                className="mb-3 flex-row items-center justify-center rounded-xl border border-violet-200 bg-violet-50 py-3 active:bg-violet-100"
                onPress={() => void pickVideoAsset()}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#7c3aed" />
                ) : (
                  <>
                    <Ionicons name="videocam-outline" size={18} color="#7c3aed" />
                    <Text className="ml-2 text-sm font-semibold text-violet-800">갤러리에서 영상 업로드</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                className="mb-4 flex-row items-center justify-center rounded-xl border border-kemix-border bg-kemix-surface py-3"
                onPress={() => void pickPosterForVideo()}
                disabled={uploading}
              >
                <Ionicons name="image-outline" size={18} color="#64748b" />
                <Text className="ml-2 text-sm font-semibold text-kemix-text">썸네일 이미지 업로드</Text>
              </Pressable>
            </>
          ) : (
            <>
              <AdminFormField
                label={form.mediaType === 'gif' ? 'GIF URL' : '이미지 URL'}
                value={form.imageUrl}
                onChangeText={(text) => setForm((prev) => ({ ...prev, imageUrl: text }))}
                placeholder="https://..."
              />
              <Pressable
                className="mb-4 flex-row items-center justify-center rounded-xl border border-violet-200 bg-violet-50 py-3 active:bg-violet-100"
                onPress={() => void pickImageAsset(form.mediaType === 'gif')}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#7c3aed" />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={18} color="#7c3aed" />
                    <Text className="ml-2 text-sm font-semibold text-violet-800">
                      갤러리에서 {homeBannerMediaLabel(form.mediaType)} 업로드
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={{ width: '100%', height: 140, borderRadius: 12, marginBottom: 16 }}
              resizeMode="cover"
            />
          ) : null}

          {form.mediaType === 'video' && form.videoUrl.trim() ? (
            <Text className="mb-4 text-[11px] text-kemix-text-secondary" numberOfLines={2}>
              영상: {form.videoUrl.trim()}
            </Text>
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
