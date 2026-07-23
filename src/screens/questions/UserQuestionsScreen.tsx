import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { ServicePolicyContent } from '@/components/legal/ServicePolicyContent';
import { QuestionListSkeleton } from '@/components/ui/QuestionListSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useMyQuestionsInfinite } from '@/hooks/useMyQuestionsInfinite';
import { MY_QUESTIONS_QUERY_KEY } from '@/lib/queryClient';
import type { UserQuestionWithAnswer } from '@/lib/supabaseClient';
import {
  createQuestion,
  QuestionServiceError,
} from '@/services/questionService';
import { consumeAuthIntent } from '@/utils/authIntent';

const LIST_ESTIMATED_ITEM_SIZE = 132;

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

const StatusBadge = memo(function StatusBadge({ status }: { status: 'pending' | 'answered' }) {
  const answered = status === 'answered';
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${answered ? 'bg-green-100' : 'bg-amber-100'}`}>
      <Text className={`text-[10px] font-bold ${answered ? 'text-green-700' : 'text-amber-700'}`}>
        {answered ? '답변 완료' : '답변 대기'}
      </Text>
    </View>
  );
});

type QuestionCardProps = {
  item: UserQuestionWithAnswer;
  onPress: (id: string) => void;
};

const QuestionCard = memo(function QuestionCard({ item, onPress }: QuestionCardProps) {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <Pressable
      className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
      onPress={handlePress}
    >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-bold text-slate-900" numberOfLines={2}>
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      <Text className="mt-2 text-sm leading-6 text-slate-600" numberOfLines={2}>
        {item.content}
      </Text>
      <Text className="mt-2 text-xs text-slate-400">
        {new Date(item.created_at).toLocaleString('ko-KR')}
      </Text>
    </Pressable>
  );
});

export function UserQuestionsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error: listError,
  } = useMyQuestionsInfinite(user?.id);

  const [formVisible, setFormVisible] = useState(false);
  const [detail, setDetail] = useState<UserQuestionWithAnswer | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const questions = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  useEffect(() => {
    if (!user) return;
    void consumeAuthIntent().then((intent) => {
      if (intent?.type === 'question-write') {
        setFormVisible(true);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!detail?.id) return;
    const updated = questions.find((item) => item.id === detail.id);
    if (!updated) return;
    const answerChanged =
      updated.answer?.id !== detail.answer?.id ||
      updated.answer?.content !== detail.answer?.content;
    if (updated.status !== detail.status || answerChanged) {
      setDetail(updated);
    }
  }, [questions, detail]);

  const handleQuestionPress = useCallback(
    (id: string) => {
      const found = questions.find((item) => item.id === id);
      if (found) setDetail(found);
    },
    [questions],
  );

  const renderItem = useCallback(
    ({ item }: { item: UserQuestionWithAnswer }) => (
      <QuestionCard item={item} onPress={handleQuestionPress} />
    ),
    [handleQuestionPress],
  );

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSubmit = async () => {
    if (!user?.id) {
      showAlert('로그인 필요', '로그인 후 질문을 등록할 수 있습니다.');
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (trimmedTitle.length < 2) {
      showAlert('입력 확인', '제목을 2자 이상 입력해 주세요.');
      return;
    }
    if (trimmedContent.length < 5) {
      showAlert('입력 확인', '내용을 5자 이상 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await createQuestion(user.id, trimmedTitle, trimmedContent, {
        name: user.user_metadata?.name as string | undefined,
        email: user.email ?? undefined,
      });
      setTitle('');
      setContent('');
      setFormVisible(false);
      await queryClient.invalidateQueries({ queryKey: [MY_QUESTIONS_QUERY_KEY, user.id] });
      showAlert('등록 완료', '구급대원이 확인 후 답변드립니다.');
    } catch (err) {
      const detail =
        err instanceof QuestionServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : '잠시 후 다시 시도해 주세요.';
      showAlert('등록 실패', detail);
    } finally {
      setSubmitting(false);
    }
  };

  const listEmpty = useMemo(
    () => (
      <View className="items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16">
        <Ionicons name="chatbox-ellipses-outline" size={40} color="#cbd5e1" />
        <Text className="mt-3 text-sm text-slate-500">아직 등록한 질문이 없습니다</Text>
      </View>
    ),
    [],
  );

  const listFooter = useMemo(() => {
    if (!isFetchingNextPage) return <View className="h-4" />;
    return (
      <View className="items-center py-4">
        <ActivityIndicator color="#15803d" />
      </View>
    );
  }, [isFetchingNextPage]);

  if (!user) {
    return null;
  }

  if (detail) {
    return (
      <View className="flex-1 bg-slate-50">
        <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 py-3">
          <Pressable className="flex-row items-center" onPress={() => setDetail(null)}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
            <Text className="ml-2 font-semibold text-slate-900">내 질문</Text>
          </Pressable>
        </SafeAreaView>
        <ScrollView contentContainerClassName="p-4 pb-10">
          <View className="rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-lg font-bold text-slate-900">{detail.title}</Text>
              <StatusBadge status={detail.status} />
            </View>
            <Text className="mt-3 text-sm leading-7 text-slate-700">{detail.content}</Text>
            <Text className="mt-3 text-xs text-slate-400">
              {new Date(detail.created_at).toLocaleString('ko-KR')}
            </Text>
          </View>

          {detail.answer ? (
            <View className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
              <Text className="text-sm font-bold text-green-800">구급대원 답변</Text>
              <Text className="mt-2 text-sm leading-7 text-green-900">{detail.answer.content}</Text>
              <Text className="mt-2 text-xs text-green-700">
                {new Date(detail.answer.created_at).toLocaleString('ko-KR')}
              </Text>
              <View className="mt-3 flex-row justify-end">
                <ReportContentButton
                  contentId={detail.answer.id}
                  contentType="comment"
                  preview={detail.answer.content}
                />
              </View>
            </View>
          ) : (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Text className="text-sm text-amber-800">승인된 구급대원이 답변을 준비 중입니다.</Text>
            </View>
          )}

          <View className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-3">
            <Text className="text-center text-xs font-bold text-red-700">
              위급 상황 시 반드시 119에 신고하십시오
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const showInitialSkeleton = isLoading && questions.length === 0;

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-4">
        <Text className="text-xl font-bold text-slate-900">구급대원에게 질문하기</Text>
        <Text className="mt-1 text-sm text-slate-500">
          참고용 안내 · 진단·처방을 대신하지 않습니다
        </Text>
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-green-700 py-3.5 active:bg-green-800"
          onPress={() => setFormVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text className="ml-2 font-bold text-white">질문하기</Text>
        </Pressable>
      </SafeAreaView>

      <View className="flex-1 px-4 pt-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          내 질문 목록
        </Text>

        {listError ? (
          <View className="rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">
              {listError instanceof Error ? listError.message : '목록을 불러오지 못했습니다.'}
            </Text>
          </View>
        ) : null}

        {showInitialSkeleton ? (
          <QuestionListSkeleton />
        ) : (
          <View className="min-h-0 flex-1">
            <FlashList
            data={questions}
            estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={listFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        )}
      </View>

      <Modal visible={formVisible} animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <SafeAreaView className="flex-1 bg-slate-50">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <Text className="text-lg font-bold text-slate-900">질문 작성</Text>
              <Pressable onPress={() => setFormVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="p-4 pb-8">
              <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2">
                <Text className="text-xs font-bold text-red-700">
                  응급·생명 위협 상황은 119에 즉시 신고하세요. 본 질문은 참고용입니다.
                </Text>
              </View>
              <Text className="mb-1 text-xs font-semibold text-slate-500">제목</Text>
              <TextInput
                className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                placeholder="예: 가슴 통증 환자 이송 시 주의점"
                value={title}
                onChangeText={setTitle}
              />
              <Text className="mb-1 text-xs font-semibold text-slate-500">내용</Text>
              <TextInput
                className="min-h-[140px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                placeholder="상황을 구체적으로 적어 주세요. 환자 실명·연락처는 입력하지 마세요."
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
              <View className="mt-4">
                <ServicePolicyContent showIntro={false} showFooter={false} />
              </View>
              <Pressable
                className={`mt-4 items-center rounded-2xl py-4 ${submitting ? 'bg-slate-300' : 'bg-slate-900'}`}
                disabled={submitting}
                onPress={() => void handleSubmit()}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">질문 등록</Text>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
