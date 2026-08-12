import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { APP_SPACING } from '@/constants/appTheme';
import {
  LOCAL_COMMUNITY_CATEGORIES,
  LOCAL_COMMUNITY_CATEGORY_LABELS,
  type LocalCommunityCategory,
} from '@/types/localCommunity';

const EMPTY_FORM = {
  title: '',
  topic: '',
  category: 'pediatric_wait' as LocalCommunityCategory,
  description: '',
};

type LocalCommunityCreateRoomModalProps = {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    topic?: string;
    category?: LocalCommunityCategory;
    description?: string;
  }) => Promise<void>;
};

export function LocalCommunityCreateRoomModal({
  visible,
  submitting,
  onClose,
  onSubmit,
}: LocalCommunityCreateRoomModalProps) {
  const { colors } = useAppTheme();
  const [form, setForm] = useState(EMPTY_FORM);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit({
      title: form.title,
      topic: form.topic || undefined,
      category: form.category,
      description: form.description || undefined,
    });
    setForm(EMPTY_FORM);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: APP_SPACING.contentHorizontal,
            paddingTop: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-1 text-xl font-bold" style={{ color: colors.textPrimary }}>
            채팅방 개설하기
          </Text>
          <Text className="mb-5 text-sm" style={{ color: colors.textSecondary }}>
            주제·지역별 오픈채팅방을 만들고 실시간으로 소통해 보세요.
          </Text>

          <Text className="mb-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>
            방 제목
          </Text>
          <TextInput
            className="mb-4 rounded-xl border px-3 py-3 text-sm"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            }}
            placeholder="예: 강남 야간 소아과 대기방"
            placeholderTextColor={colors.textMuted}
            value={form.title}
            onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
            maxLength={60}
          />

          <Text className="mb-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>
            주제 분류
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {LOCAL_COMMUNITY_CATEGORIES.map((category) => {
              const active = form.category === category;
              return (
                <Pressable
                  key={category}
                  className="rounded-full px-3 py-2 active:opacity-90"
                  style={{
                    backgroundColor: active ? colors.categoryAccent : colors.surface,
                    borderWidth: 1,
                    borderColor: active ? colors.categoryAccent : colors.border,
                  }}
                  onPress={() => setForm((prev) => ({ ...prev, category }))}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? '#fff' : colors.textSecondary }}
                  >
                    {LOCAL_COMMUNITY_CATEGORY_LABELS[category]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>
            주제 태그 (선택)
          </Text>
          <TextInput
            className="mb-4 rounded-xl border px-3 py-3 text-sm"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            }}
            placeholder="예: 소아과, 야간진료"
            placeholderTextColor={colors.textMuted}
            value={form.topic}
            onChangeText={(topic) => setForm((prev) => ({ ...prev, topic }))}
            maxLength={40}
          />

          <Text className="mb-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>
            방 소개 (선택)
          </Text>
          <TextInput
            className="mb-6 rounded-xl border px-3 py-3 text-sm"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="채팅방 이용 안내를 간단히 적어 주세요."
            placeholderTextColor={colors.textMuted}
            value={form.description}
            onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
            multiline
            maxLength={200}
          />

          <Pressable
            className="flex-row items-center justify-center rounded-xl py-3.5 active:opacity-90"
            style={{ backgroundColor: colors.blue }}
            disabled={submitting}
            onPress={() => void handleSubmit()}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text className="ml-2 text-sm font-bold text-white">
              {submitting ? '개설 중…' : '채팅방 개설'}
            </Text>
          </Pressable>

          <Pressable className="mt-3 items-center py-2" onPress={handleClose}>
            <Text className="text-sm font-semibold" style={{ color: colors.textMuted }}>
              취소
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
