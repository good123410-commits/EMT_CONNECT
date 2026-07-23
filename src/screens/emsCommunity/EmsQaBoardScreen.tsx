import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';
import { CommunityHtmlContent } from '@/components/community/CommunityHtmlContent';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import {
  createPostComment,
  createQaPost,
  fetchPostComments,
  fetchQaPostsPage,
  formatRelativeTime,
  parseCommunityError,
} from '@/services/communityService';
import type { CommunityComment, CommunityPost } from '@/types/community';
import {
  buildCommunityPreview,
  getFirstCommunityImageUrl,
} from '@/utils/communityContent';
import { canWriteCommunityAnswer } from '@/utils/communityRbac';
import { consumeAuthIntent } from '@/utils/authIntent';

function QaPostCard({ post, onPress }: { post: CommunityPost; onPress: () => void }) {
  const preview = buildCommunityPreview(post.content, post.summary);
  const thumb = getFirstCommunityImageUrl(post.content);

  return (
    <Pressable
      className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
      onPress={onPress}
    >
      <View className="flex-row items-start gap-3">
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            style={{ width: 72, height: 72, borderRadius: 10 }}
            resizeMode="cover"
          />
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
            {post.title?.trim() || '제목 없음'}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-slate-600" numberOfLines={2}>
            {preview}
          </Text>
          <Text className="mt-2 text-xs text-slate-400">
            {post.anonymous_label} · {formatRelativeTime(post.created_at)} · 답변 {post.comment_count}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
    </Pressable>
  );
}

function CommentRow({ comment }: { comment: CommunityComment }) {
  return (
    <View className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-slate-700">{comment.anonymous_label}</Text>
        <Text className="text-[10px] text-slate-400">{formatRelativeTime(comment.created_at)}</Text>
      </View>
      <View className="mt-2">
        <CommunityHtmlContent content={comment.content} />
      </View>
    </View>
  );
}

type EmsQaBoardScreenProps = {
  /** 구급대원 탭 등에서 재사용 시 헤더 문구 조정 */
  variant?: 'default' | 'paramedic';
};

export function EmsQaBoardScreen({ variant = 'default' }: EmsQaBoardScreenProps) {
  const { user } = useAuth();
  const { role, isApproved } = useUserRole();
  const canAnswer = canWriteCommunityAnswer(role, isApproved);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const [writeOpen, setWriteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginIntent, setLoginIntent] = useState<'question-write' | 'community-write'>('question-write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const hasMore = posts.length < totalCount;

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const result = await fetchQaPostsPage(pageNum);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setPosts((prev) => (append ? [...prev, ...result.posts] : result.posts));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    if (!user) return;
    void consumeAuthIntent().then((intent) => {
      if (intent?.type === 'question-write' || intent?.type === 'community-write') {
        setWriteOpen(true);
      }
    });
  }, [user]);

  const loadComments = useCallback(async (postId: string) => {
    setCommentsLoading(true);
    try {
      const rows = await fetchPostComments(postId);
      setComments(rows);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const openPost = useCallback(
    (post: CommunityPost) => {
      setSelected(post);
      void loadComments(post.id);
    },
    [loadComments],
  );

  useHardwareBackHandler(() => {
    if (selected) {
      setSelected(null);
      return true;
    }
    if (writeOpen) {
      setWriteOpen(false);
      return true;
    }
    return false;
  }, Boolean(selected || writeOpen));

  const openLogin = (intent: 'question-write' | 'community-write') => {
    setLoginIntent(intent);
    setLoginOpen(true);
  };

  const handleWritePress = () => {
    if (!user) {
      openLogin('question-write');
      return;
    }
    setWriteOpen(true);
  };

  const handleSubmitPost = async () => {
    if (!user) {
      openLogin('question-write');
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (trimmedTitle.length < 2) {
      Alert.alert('입력 확인', '제목을 2자 이상 입력해 주세요.');
      return;
    }
    if (trimmedContent.length < 5) {
      Alert.alert('입력 확인', '내용을 5자 이상 입력해 주세요.');
      return;
    }

    setSubmittingPost(true);
    try {
      await createQaPost({
        title: trimmedTitle,
        content: trimmedContent,
        authorLabel: (user.user_metadata?.name as string | undefined) ?? '회원',
      });
      setTitle('');
      setContent('');
      setWriteOpen(false);
      await loadPage(1, false);
      Alert.alert('등록 완료', '질문이 등록되었습니다.');
    } catch (err) {
      Alert.alert('등록 실패', parseCommunityError(err instanceof Error ? err.message : '다시 시도해 주세요.'));
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selected) return;
    if (!canAnswer) return;
    if (!answerText.trim()) {
      Alert.alert('입력 확인', '답변 내용을 입력해 주세요.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await createPostComment(
        selected.id,
        answerText,
        null,
        (user?.user_metadata?.name as string | undefined) ?? '구급대원',
      );
      setAnswerText('');
      await loadComments(selected.id);
      Alert.alert('등록 완료', '답변이 등록되었습니다.');
    } catch (err) {
      Alert.alert('등록 실패', parseCommunityError(err instanceof Error ? err.message : '다시 시도해 주세요.'));
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (selected) {
    return (
      <View className="flex-1 bg-slate-50">
        <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 py-3">
          <Pressable className="flex-row items-center" onPress={() => setSelected(null)}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
            <Text className="ml-2 font-semibold text-slate-900">질문 상세</Text>
          </Pressable>
        </SafeAreaView>
        <ScrollView contentContainerClassName="p-4 pb-10">
          <View className="rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-lg font-bold text-slate-900">{selected.title}</Text>
            <Text className="mt-1 text-xs text-slate-400">
              {selected.anonymous_label} · {formatRelativeTime(selected.created_at)}
            </Text>
            <View className="mt-4">
              <CommunityHtmlContent content={selected.content} />
            </View>
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-sm font-bold text-slate-800">답변 {comments.length}</Text>
            {commentsLoading ? <ActivityIndicator color="#15803d" /> : null}
            {comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
            {!commentsLoading && comments.length === 0 ? (
              <Text className="text-sm text-slate-500">아직 답변이 없습니다.</Text>
            ) : null}
          </View>

          {canAnswer ? (
            <View className="mt-4 rounded-2xl border border-green-200 bg-white p-4">
              <Text className="mb-2 text-sm font-bold text-green-800">답변 작성</Text>
              <TextInput
                className="min-h-[100px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
                placeholder="구급대원 답변을 입력해 주세요"
                value={answerText}
                onChangeText={setAnswerText}
                multiline
                textAlignVertical="top"
              />
              <Pressable
                className={`mt-3 items-center rounded-xl py-3 ${submittingAnswer ? 'bg-slate-300' : 'bg-green-700'}`}
                disabled={submittingAnswer}
                onPress={() => void handleSubmitAnswer()}
              >
                <Text className="font-bold text-white">답변 등록</Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Text className="text-center text-sm text-amber-800">
                답변은 구급대원 및 관리자만 작성 가능합니다.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const headerTitle = variant === 'paramedic' ? '질문 게시판' : EMS_COMMUNITY_TAB_LABEL;
  const headerSubtitle =
    variant === 'paramedic'
      ? '회원 질문에 답변해 주세요'
      : '응급·현장 관련 질문을 남기고 답변을 확인하세요';

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-4">
        <Text className="text-xl font-bold text-slate-900">{headerTitle}</Text>
        <Text className="mt-1 text-sm text-slate-500">{headerSubtitle}</Text>
        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-green-700 py-3.5 active:bg-green-800"
          onPress={handleWritePress}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text className="ml-2 font-bold text-white">질문하기</Text>
        </Pressable>
      </SafeAreaView>

      <View className="flex-1 px-4 pt-4">
        {error ? (
          <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#15803d" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <QaPostCard post={item} onPress={() => openPost(item)} />}
            ListEmptyComponent={
              <View className="items-center rounded-2xl border border-dashed border-slate-200 bg-white py-16">
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text className="mt-3 text-sm text-slate-500">아직 질문이 없습니다</Text>
              </View>
            }
            onEndReached={() => {
              if (!hasMore || loadingMore) return;
              void loadPage(page + 1, true);
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4">
                  <ActivityIndicator color="#15803d" />
                </View>
              ) : (
                <View className="h-8" />
              )
            }
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>

      <GuestLoginPromptModal
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="로그인이 필요한 서비스입니다"
        description="질문을 남기시려면 로그인 또는 회원가입이 필요합니다."
        intent={{ type: loginIntent }}
        kakaoLabel="카카오 3초 로그인"
        googleLabel="구글 로그인"
      />

      <Modal visible={writeOpen} animationType="slide" onRequestClose={() => setWriteOpen(false)}>
        <SafeAreaView className="flex-1 bg-slate-50">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <Text className="text-lg font-bold text-slate-900">질문 작성</Text>
              <Pressable onPress={() => setWriteOpen(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="p-4 pb-8">
              <Text className="mb-1 text-xs font-semibold text-slate-500">제목</Text>
              <TextInput
                className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                placeholder="질문 제목"
                value={title}
                onChangeText={setTitle}
              />
              <Text className="mb-1 text-xs font-semibold text-slate-500">내용</Text>
              <TextInput
                className="min-h-[160px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                placeholder="상황을 구체적으로 적어 주세요"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
              <Pressable
                className={`mt-4 items-center rounded-2xl py-4 ${submittingPost ? 'bg-slate-300' : 'bg-slate-900'}`}
                disabled={submittingPost}
                onPress={() => void handleSubmitPost()}
              >
                {submittingPost ? (
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
