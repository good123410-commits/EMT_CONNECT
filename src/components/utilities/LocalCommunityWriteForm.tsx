import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import type { LocalCommunityCategory } from '@/types/localCommunity';
import { LOCAL_COMMUNITY_CATEGORY_LABELS } from '@/types/localCommunity';

type LocalCommunityWriteFormProps = {
  category: LocalCommunityCategory;
  onSubmit: (content: string) => Promise<void>;
};

export function LocalCommunityWriteForm({ category, onSubmit }: LocalCommunityWriteFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      Alert.alert('입력 필요', '내용을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 500) {
      Alert.alert('입력 제한', '500자 이내로 작성해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent('');
      Alert.alert('등록 완료', '24시간 후 자동으로 사라집니다.');
    } catch {
      Alert.alert('등록 실패', '글을 등록하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="mb-5 rounded-2xl border border-teal-100 bg-kemix-surface p-4">
      <View className="flex-row items-center">
        <Ionicons name="create-outline" size={18} color="#0d9488" />
        <Text className="ml-1.5 text-sm font-bold text-kemix-text">익명 글쓰기</Text>
      </View>
      <Text className="mt-2 text-[11px] leading-4 text-kemix-text-secondary">
        「{LOCAL_COMMUNITY_CATEGORY_LABELS[category]}」 카테고리로 등록됩니다. 개인정보·비방은 삼가해 주세요.
      </Text>
      <TextInput
        className="mt-3 min-h-[88px] rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
        placeholder="대기 시간, 야간 진료 정보, 응급·육아 팁을 공유해 주세요"
        placeholderTextColor="#94a3b8"
        multiline
        textAlignVertical="top"
        value={content}
        onChangeText={setContent}
        maxLength={500}
        editable={!submitting}
      />
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-[10px] text-kemix-muted">{content.length}/500 · 24시간 후 자동 삭제</Text>
        <Pressable
          className={`rounded-xl px-4 py-2.5 ${submitting ? 'bg-teal-300' : 'bg-teal-600 active:bg-teal-700'}`}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          <Text className="text-sm font-bold text-white">{submitting ? '등록 중…' : '등록'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
