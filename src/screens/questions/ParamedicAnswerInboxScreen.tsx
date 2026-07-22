import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ExpertAnswerInboxGuard } from '@/components/guards/ExpertAnswerInboxGuard';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import {
  SettingsSubScreenHeader,
  useIsSettingsSubScreen,
} from '@/components/settings/SettingsSubScreenHeader';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { usePendingQuestionsRealtime } from '@/hooks/usePendingQuestionsRealtime';
import type { UserQuestion } from '@/lib/supabaseClient';
import {
  fetchQuestionForExpert,
  QuestionServiceError,
  submitParamedicAnswer,
} from '@/services/questionService';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function PendingCard({ item, onPress }: { item: UserQuestion; onPress: () => void }) {
  return (
    <Pressable
      className="mb-3 rounded-2xl border border-amber-200 bg-white p-4 active:bg-amber-50/40"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-bold text-slate-900">{item.title}</Text>
        <View className="rounded-full bg-amber-100 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-amber-700">대기</Text>
        </View>
      </View>
      <Text className="mt-2 text-sm leading-6 text-slate-600" numberOfLines={3}>
        {item.content}
      </Text>
      <Text className="mt-2 text-xs text-slate-400">
        {new Date(item.created_at).toLocaleString('ko-KR')}
      </Text>
    </Pressable>
  );
}

function ParamedicAnswerInboxContent() {
  const fromSettings = useIsSettingsSubScreen();
  const { pending, loading, error, reload } = usePendingQuestionsRealtime();
  const [selected, setSelected] = useState<UserQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useHardwareBackHandler(() => {
    if (selected) {
      setSelected(null);
      setAnswerText('');
      return true;
    }
    return false;
  }, Boolean(selected));

  const handleSelect = async (item: UserQuestion) => {
    try {
      const fresh = await fetchQuestionForExpert(item.id);
      if (!fresh || fresh.status !== 'pending') {
        showAlert('알림', '이미 다른 구급대원이 답변했거나 삭제된 질문입니다.');
        void reload();
        return;
      }
      setSelected(fresh);
      setAnswerText('');
      setFormError(null);
    } catch (err) {
      showAlert(
        '불러오기 실패',
        err instanceof QuestionServiceError ? err.message : '질문을 불러오지 못했습니다.',
      );
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selected || submitting) return;

    const trimmed = answerText.trim();
    if (trimmed.length < 5) {
      setFormError('답변은 5자 이상 입력해 주세요.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await submitParamedicAnswer(selected.id, trimmed);
      setSelected(null);
      setAnswerText('');
      await reload();
      showAlert('등록 완료', '답변이 등록되었습니다. 질문 상태가 answered로 변경됩니다.');
    } catch (err) {
      const message =
        err instanceof QuestionServiceError ? err.message : '잠시 후 다시 시도해 주세요.';
      setFormError(message);
      showAlert('등록 실패', message);
    } finally {
      setSubmitting(false);
    }
  };

  const ScreenHeader = fromSettings ? (
    <SettingsSubScreenHeader
      title="전문가 전용 답변함"
      subtitle="pending 질문 Realtime 구독"
    />
  ) : (
    <ParamedicHeader subtitle="답변 대기함 · Realtime" />
  );

  if (selected) {
    return (
      <View className="flex-1 bg-green-50/30">
        {ScreenHeader}
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView contentContainerClassName="p-4 pb-28">
            <Pressable
              className="mb-4 flex-row items-center"
              onPress={() => {
                setSelected(null);
                setAnswerText('');
              }}
            >
              <Ionicons name="arrow-back" size={22} color="#14532d" />
              <Text className="ml-2 font-semibold text-green-900">대기함</Text>
            </Pressable>

            <View className="rounded-2xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-bold text-slate-900">{selected.title}</Text>
              <Text className="mt-3 text-sm leading-7 text-slate-700">{selected.content}</Text>
              <Text className="mt-2 text-xs text-slate-400">
                {new Date(selected.created_at).toLocaleString('ko-KR')}
              </Text>
              <View className="mt-3 flex-row justify-end">
                <ReportContentButton
                  contentId={selected.id}
                  contentType="post"
                  preview={selected.title}
                />
              </View>
            </View>

            <View className="mt-4 rounded-2xl border border-green-200 bg-white p-4">
              <Text className="mb-2 text-sm font-bold text-slate-800">답변 작성</Text>
              <Text className="mb-3 text-xs leading-5 text-slate-500">
                현장 실무 경험 기반 참고 안내입니다. 원격 진료·개별 처방이 아님을 유의하세요.
              </Text>
              <TextInput
                className="min-h-[160px] rounded-xl border border-green-200 bg-green-50/40 px-3 py-3 text-sm"
                placeholder="구급대원 관점의 참고 답변을 작성해 주세요"
                value={answerText}
                onChangeText={(text) => {
                  setAnswerText(text);
                  if (formError) setFormError(null);
                }}
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />
              {formError ? (
                <Text className="mt-2 text-xs text-red-600">{formError}</Text>
              ) : null}
              <Pressable
                className={`mt-4 items-center rounded-xl py-3.5 ${submitting ? 'bg-slate-300' : 'bg-green-700'}`}
                disabled={submitting}
                onPress={() => void handleSubmitAnswer()}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">답변 제출</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-50/30">
      {ScreenHeader}

      <View className="border-b border-green-200 bg-white px-4 py-3">
        <Text className="text-sm font-bold text-slate-900">답변 대기 질문</Text>
        <Text className="mt-0.5 text-xs text-slate-500">
          status=pending · Supabase Realtime 자동 갱신
        </Text>
        {error ? (
          <Text className="mt-2 text-xs text-red-600">{error}</Text>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#15803d" />
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-28"
          ListEmptyComponent={
            <View className="items-center rounded-2xl border border-dashed border-green-200 bg-white py-16">
              <Ionicons name="mail-open-outline" size={40} color="#86efac" />
              <Text className="mt-3 text-sm text-slate-500">대기 중인 질문이 없습니다</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PendingCard item={item} onPress={() => void handleSelect(item)} />
          )}
        />
      )}
    </View>
  );
}

export function ParamedicAnswerInboxScreen() {
  return (
    <ExpertAnswerInboxGuard>
      <ParamedicAnswerInboxContent />
    </ExpertAnswerInboxGuard>
  );
}
