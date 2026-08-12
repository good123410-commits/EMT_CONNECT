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
import {
  LoungeAnonymousBadge,
  LoungeBackBar,
  LoungeCard,
  LoungeCommentButton,
  LoungeErrorBanner,
  LoungeInput,
  LoungeMetaText,
  LoungePrimaryButton,
  LoungeScreen,
  LoungeTitle,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useParamedicTabWrite } from '@/hooks/useParamedicTabWrite';
import {
  createPostComment,
  createQaPost,
  fetchPostComments,
  fetchQaPostsPage,
  formatRelativeTime,
  parseCommunityError,
} from '@/services/communityService';
import type { CommunityComment, CommunityPost } from '@/types/community';
import { getFirstCommunityImageUrl } from '@/utils/communityContent';
import { canWriteCommunityAnswer } from '@/utils/communityRbac';
import { consumeAuthIntent } from '@/utils/authIntent';

function QaPostCard({
  post,
  onPress,
  lounge,
}: {
  post: CommunityPost;
  onPress: () => void;
  lounge?: boolean;
}) {
  const { lounge: loungeColors } = useEmsLoungeTheme();
  const thumb = getFirstCommunityImageUrl(post.content);

  if (lounge) {
    return (
      <LoungeCard onPress={onPress}>
        <View className="flex-row items-center gap-3">
          {thumb ? (
            <Image
              source={{ uri: thumb }}
              style={{ width: 48, height: 48, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : null}
          <View className="flex-1">
            <LoungeTitle numberOfLines={1}>{post.title?.trim() || '제목 없음'}</LoungeTitle>
            <View className="mt-1 flex-row items-center gap-2">
              <LoungeAnonymousBadge label={post.anonymous_label} />
              <LoungeMetaText>{formatRelativeTime(post.created_at)}</LoungeMetaText>
              <LoungeCommentButton count={post.comment_count} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={loungeColors.textMuted} />
        </View>
      </LoungeCard>
    );
  }

  return (
    <Pressable
      className="mb-3 rounded-2xl border border-kemix-border bg-kemix-surface p-4 active:bg-kemix-bg"
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            style={{ width: 48, height: 48, borderRadius: 6 }}
            resizeMode="cover"
          />
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-bold text-kemix-text" numberOfLines={1}>
            {post.title?.trim() || '제목 없음'}
          </Text>
          <Text className="mt-1 text-xs text-kemix-muted">
            {post.anonymous_label} · {formatRelativeTime(post.created_at)} · 답변{' '}
            {post.comment_count}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </View>
    </Pressable>
  );
}

function CommentRow({ comment, lounge }: { comment: CommunityComment; lounge?: boolean }) {
  if (lounge) {
    return (
      <LoungeCard style={{ marginBottom: 10 }}>
        <View className="flex-row items-center justify-between">
          <LoungeAnonymousBadge label={comment.anonymous_label} />
          <LoungeMetaText>{formatRelativeTime(comment.created_at)}</LoungeMetaText>
        </View>
        <View className="mt-3">
          <CommunityHtmlContent content={comment.content} />
        </View>
      </LoungeCard>
    );
  }

  return (
    <View className="mb-3 rounded-xl border border-kemix-border-light bg-kemix-bg p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-kemix-text">{comment.anonymous_label}</Text>
        <Text className="text-[10px] text-kemix-muted">{formatRelativeTime(comment.created_at)}</Text>
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
  const { lounge } = useEmsLoungeTheme();
  const isLounge = variant === 'paramedic';
  const loungeListContentStyle = useLoungeListContentStyle();
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
  const [loginIntent, setLoginIntent] = useState<'question-write' | 'community-write'>(
    'question-write',
  );
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
  });

  const openLogin = (intent: 'question-write' | 'community-write') => {
    setLoginIntent(intent);
    setLoginOpen(true);
  };

  const handleWritePress = useCallback(() => {
    if (!user) {
      openLogin('question-write');
      return;
    }
    setWriteOpen(true);
  }, [user]);

  useParamedicTabWrite('QaBoard', handleWritePress, { enabled: isLounge });

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
      const created = await createQaPost({
        title: trimmedTitle,
        content: trimmedContent,
        authorLabel: (user.user_metadata?.name as string | undefined) ?? '회원',
      });
      setTitle('');
      setContent('');
      setWriteOpen(false);
      setPosts((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setTotalCount((count) => count + 1);
      await loadPage(1, false);
      Alert.alert('등록 완료', '질문이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        parseCommunityError(err instanceof Error ? err.message : '다시 시도해 주세요.'),
      );
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
      Alert.alert(
        '등록 실패',
        parseCommunityError(err instanceof Error ? err.message : '다시 시도해 주세요.'),
      );
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (selected) {
    if (isLounge) {
      return (
        <LoungeScreen>
          <ParamedicHeader />
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <LoungeBackBar label="질문 상세" onPress={() => setSelected(null)} />
            <View style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}>
              <LoungeCard>
                <LoungeTitle>{selected.title ?? '제목 없음'}</LoungeTitle>
                <View className="mt-2 flex-row flex-wrap items-center gap-2">
                  <LoungeAnonymousBadge label={selected.anonymous_label} />
                  <LoungeMetaText>{formatRelativeTime(selected.created_at)}</LoungeMetaText>
                </View>
                <View className="mt-4">
                  <CommunityHtmlContent content={selected.content} />
                </View>
              </LoungeCard>

              <Text
                style={{
                  marginTop: 20,
                  marginBottom: 10,
                  fontFamily: 'Pretendard-Bold',
                  fontSize: 14,
                  color: lounge.text,
                }}
              >
                답변 {comments.length}
              </Text>
              {commentsLoading ? <ActivityIndicator color={lounge.accent} /> : null}
              {comments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} lounge />
              ))}
              {!commentsLoading && comments.length === 0 ? (
                <Text
                  style={{
                    fontFamily: 'Pretendard',
                    fontSize: 14,
                    color: lounge.textSecondary,
                  }}
                >
                  아직 답변이 없습니다.
                </Text>
              ) : null}

              {canAnswer ? (
                <LoungeCard style={{ marginTop: 16 }}>
                  <Text
                    style={{
                      marginBottom: 10,
                      fontFamily: 'Pretendard-Bold',
                      fontSize: 14,
                      color: lounge.text,
                    }}
                  >
                    답변 작성
                  </Text>
                  <LoungeInput
                    value={answerText}
                    onChangeText={setAnswerText}
                    placeholder="구급대원 답변을 입력해 주세요"
                    multiline
                    minHeight={100}
                  />
                  <LoungePrimaryButton
                    label="답변 등록"
                    onPress={() => void handleSubmitAnswer()}
                  />
                </LoungeCard>
              ) : (
                <View
                  style={{
                    marginTop: 16,
                    borderRadius: 16,
                    backgroundColor: lounge.amberBg,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontFamily: 'Pretendard',
                      fontSize: 13,
                      color: lounge.amberText,
                    }}
                  >
                    답변은 구급대원 및 관리자만 작성 가능합니다.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </LoungeScreen>
      );
    }

    return (
      <View className="flex-1 bg-kemix-bg">
        <SafeAreaView edges={['top']} className="border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <Pressable className="flex-row items-center" onPress={() => setSelected(null)}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
            <Text className="ml-2 font-semibold text-kemix-text">질문 상세</Text>
          </Pressable>
        </SafeAreaView>
        <ScrollView contentContainerClassName="p-4 pb-10">
          <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
            <Text className="text-lg font-bold text-kemix-text">{selected.title}</Text>
            <Text className="mt-1 text-xs text-kemix-muted">
              {selected.anonymous_label} · {formatRelativeTime(selected.created_at)}
            </Text>
            <View className="mt-4">
              <CommunityHtmlContent content={selected.content} />
            </View>
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-sm font-bold text-kemix-text">답변 {comments.length}</Text>
            {commentsLoading ? <ActivityIndicator color="#15803d" /> : null}
            {comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
            {!commentsLoading && comments.length === 0 ? (
              <Text className="text-sm text-kemix-text-secondary">아직 답변이 없습니다.</Text>
            ) : null}
          </View>

          {canAnswer ? (
            <View className="mt-4 rounded-2xl border border-green-200 bg-kemix-surface p-4">
              <Text className="mb-2 text-sm font-bold text-green-800">답변 작성</Text>
              <TextInput
                className="min-h-[100px] rounded-xl border border-kemix-border bg-kemix-bg px-3 py-3 text-sm"
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

  if (isLounge) {
    return (
      <LoungeScreen>
        <ParamedicHeader />

        {error ? <LoungeErrorBanner message={error} /> : null}

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={lounge.accent} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <QaPostCard post={item} onPress={() => openPost(item)} lounge />
            )}
            ListEmptyComponent={
              <View className="items-center py-16">
                <Ionicons name="chatbubbles-outline" size={40} color={lounge.textMuted} />
                <Text
                  style={{
                    marginTop: 12,
                    fontFamily: 'Pretendard',
                    fontSize: 14,
                    color: lounge.textSecondary,
                  }}
                >
                  아직 질문이 없습니다
                </Text>
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
                  <ActivityIndicator color={lounge.accent} />
                </View>
              ) : (
                <View className="h-8" />
              )
            }
            contentContainerStyle={loungeListContentStyle}
          />
        )}

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
          <KeyboardAvoidingView
            className="flex-1"
            style={{ backgroundColor: lounge.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{ backgroundColor: lounge.surface }}
            >
              <Text
                style={{
                  fontFamily: 'Pretendard-Bold',
                  fontSize: 18,
                  color: lounge.text,
                }}
              >
                질문 작성
              </Text>
              <Pressable onPress={() => setWriteOpen(false)}>
                <Ionicons name="close" size={24} color={lounge.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
              <Text
                style={{
                  marginBottom: 4,
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 12,
                  color: lounge.textMuted,
                }}
              >
                제목
              </Text>
              <LoungeInput value={title} onChangeText={setTitle} placeholder="질문 제목" />
              <Text
                style={{
                  marginBottom: 4,
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 12,
                  color: lounge.textMuted,
                }}
              >
                내용
              </Text>
              <LoungeInput
                value={content}
                onChangeText={setContent}
                placeholder="상황을 구체적으로 적어 주세요"
                multiline
                minHeight={160}
              />
              <LoungePrimaryButton
                label={submittingPost ? '등록 중...' : '질문 등록'}
                onPress={() => void handleSubmitPost()}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </LoungeScreen>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-kemix-bg">
      <View className="flex-1 px-4 pt-3">
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
              <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-16">
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text className="mt-3 text-sm text-kemix-text-secondary">아직 질문이 없습니다</Text>
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
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>

      <Pressable
        onPress={handleWritePress}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-green-700 shadow-lg active:bg-green-800"
        style={{ elevation: 5 }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>

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
        <SafeAreaView className="flex-1 bg-kemix-bg">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
              <Text className="text-lg font-bold text-kemix-text">질문 작성</Text>
              <Pressable onPress={() => setWriteOpen(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="p-4 pb-8">
              <Text className="mb-1 text-xs font-semibold text-kemix-text-secondary">제목</Text>
              <TextInput
                className="mb-3 rounded-xl border border-kemix-border bg-kemix-surface px-3 py-3 text-sm"
                placeholder="질문 제목"
                value={title}
                onChangeText={setTitle}
              />
              <Text className="mb-1 text-xs font-semibold text-kemix-text-secondary">내용</Text>
              <TextInput
                className="min-h-[160px] rounded-xl border border-kemix-border bg-kemix-surface px-3 py-3 text-sm"
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
    </SafeAreaView>
  );
}
