import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, FlatList, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';
import { CommunityHtmlContent } from '@/components/community/CommunityHtmlContent';
import { CommunityListPagination } from '@/components/emsCommunity/CommunityListPagination';
import { CommunityCommentSection } from '@/components/emsCommunity/CommunityCommentSection';
import { CommunityListScrollHeader } from '@/components/emsCommunity/CommunityListScrollHeader';
import { CommunityListToolbar } from '@/components/emsCommunity/CommunityListToolbar';
import { CommunityPostDetailLayout } from '@/components/emsCommunity/CommunityPostDetailLayout';
import { CommunityAuthorActions } from '@/components/emsCommunity/CommunityAuthorActions';
import { QaWriteModal, type QaEditingPost } from '@/components/emsCommunity/QaWriteModal';
import {
  LoungeAnonymousBadge,
  LoungeCard,
  LoungeCommentButton,
  LoungeLikeButton,
  LoungeMetaText,
  LoungeFab,
  LoungeScreen,
  LoungeTitle,
  communityListItemGapStyle,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useCommunityListScrollToTop } from '@/hooks/useCommunityListScrollToTop';
import { useCommunityModerator } from '@/hooks/useCommunityModerator';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useCommunityPostLike } from '@/hooks/useCommunityPostLike';
import { usePaginatedEmsPosts } from '@/hooks/usePaginatedEmsPosts';
import {
  createQaPost,
  formatRelativeTime,
  mapCommunityPostRow,
} from '@/services/communityService';
import {
  deleteCommunityPostByAuthor,
  updateCommunityPostByAuthor,
} from '@/services/communityAuthorService';
import type { EmsCommunityPostRow } from '@/services/emsCommunityService';
import type { CommunityPost } from '@/types/community';
import { getFirstCommunityImageUrl } from '@/utils/communityContent';
import { canWriteCommunityAnswer } from '@/utils/communityRbac';
import { consumeAuthIntent } from '@/utils/authIntent';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';
import {
  canViewSecretCommunityPost,
  isPostAuthor,
  resolveSecretPostTitle,
} from '@/utils/communityPostAccess';

import { isPostLiked } from '@/utils/communityPostLike';

function QaPostCard({
  post,
  onPress,
  onLike,
  lounge,
  userId,
  isAdmin,
}: {
  post: CommunityPost;
  onPress: () => void;
  onLike?: (post: CommunityPost) => void;
  lounge?: boolean;
  userId?: string | null;
  isAdmin?: boolean;
}) {
  const { lounge: loungeColors } = useEmsLoungeTheme();
  const thumb = getFirstCommunityImageUrl(post.content);
  const liked = isPostLiked(post);
  const displayTitle = resolveSecretPostTitle(
    post.title,
    post.is_secret,
    post.author_id,
    userId,
    Boolean(isAdmin),
  );
  const isMaskedSecret = post.is_secret && displayTitle !== (post.title?.trim() || '제목 없음');

  if (lounge) {
    return (
      <LoungeCard onPress={onPress}>
        <View className="flex-row items-center gap-3">
          {thumb && !isMaskedSecret ? (
            <Image
              source={{ uri: thumb }}
              style={{ width: 48, height: 48, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : null}
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              {post.is_secret ? (
                <Ionicons name="lock-closed" size={14} color={loungeColors.textMuted} />
              ) : null}
              <LoungeTitle numberOfLines={1}>{displayTitle}</LoungeTitle>
            </View>
            <View className="mt-1 flex-row items-center gap-2">
              <LoungeAnonymousBadge label={post.anonymous_label} />
              <LoungeMetaText>{formatRelativeTime(post.created_at)}</LoungeMetaText>
              <LoungeCommentButton count={post.comment_count} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={loungeColors.textMuted} />
        </View>
        {onLike ? (
          <View
            className="mt-3 flex-row justify-end border-t pt-3"
            style={{ borderTopColor: loungeColors.border }}
          >
            <LoungeLikeButton
              count={post.likes}
              liked={liked}
              onPress={() => onLike(post)}
            />
          </View>
        ) : null}
      </LoungeCard>
    );
  }

  return (
    <Pressable
      className="rounded-2xl border border-kemix-border bg-kemix-surface p-4 active:bg-kemix-bg"
      style={communityListItemGapStyle}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        {thumb && !isMaskedSecret ? (
          <Image
            source={{ uri: thumb }}
            style={{ width: 48, height: 48, borderRadius: 6 }}
            resizeMode="cover"
          />
        ) : null}
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            {post.is_secret ? (
              <Ionicons name="lock-closed" size={14} color="#94a3b8" />
            ) : null}
            <Text className="flex-1 text-base font-bold text-kemix-text" numberOfLines={1}>
              {displayTitle}
            </Text>
          </View>
          <Text className="mt-1 text-xs text-kemix-muted">
            {post.anonymous_label} · {formatRelativeTime(post.created_at)} · 답변{' '}
            {post.comment_count}
          </Text>
          {onLike ? (
            <View className="mt-3 flex-row justify-end">
              <LoungeLikeButton
                count={post.likes}
                liked={liked}
                onPress={() => onLike(post)}
              />
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </View>
    </Pressable>
  );
}

type EmsQaBoardScreenProps = {
  /** 구급대원 탭 등에서 재사용 시 헤더 문구 조정 */
  variant?: 'default' | 'paramedic';
};

export function EmsQaBoardScreen({ variant = 'default' }: EmsQaBoardScreenProps) {
  const { lounge } = useEmsLoungeTheme();
  const isLounge = variant === 'paramedic';
  const loungeListContentStyle = useLoungeListContentStyle(12, isLounge);
  const defaultFabListContentStyle = useLoungeListContentStyle(12, true);
  const { user } = useAuth();
  const { role, isApproved } = useUserRole();
  const isModerator = useCommunityModerator();
  const canAnswer = canWriteCommunityAnswer(role, isApproved);

  const mapQaRow = useCallback(
    (row: EmsCommunityPostRow) => mapCommunityPostRow(row as CommunityPost),
    [],
  );

  const [bestSortActive, setBestSortActive] = useState(false);

  const {
    items: posts,
    searchInput,
    setSearchInput,
    currentPage,
    totalCount,
    hasMultiplePages,
    loading,
    error,
    goToPage,
    refresh,
    patchPost,
  } = usePaginatedEmsPosts<CommunityPost>({
    postTypes: ['bamboo'],
    categorySlug: 'question',
    mapRow: mapQaRow,
    sort: bestSortActive ? 'popular' : 'latest',
  });

  const { listRef, scrollToTop } = useCommunityListScrollToTop<CommunityPost>();

  const [selected, setSelected] = useState<CommunityPost | null>(null);
  const [editingPost, setEditingPost] = useState<QaEditingPost | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginIntent, setLoginIntent] = useState<'question-write' | 'community-write'>(
    'question-write',
  );

  const patchPostEverywhere = useCallback(
    (id: string, updater: (prev: CommunityPost) => CommunityPost) => {
      patchPost(id, updater);
      setSelected((prev) => (prev?.id === id ? updater(prev) : prev));
    },
    [patchPost],
  );

  const { toggleLike: handleLike } = useCommunityPostLike<CommunityPost>({
    patchPost: patchPostEverywhere,
    canLike: () => Boolean(user),
    onAuthRequired: () => {
      setLoginIntent('question-write');
      setLoginOpen(true);
    },
    onError: (message) => Alert.alert('좋아요', message),
  });

  useEffect(() => {
    if (!user) return;
    void consumeAuthIntent().then((intent) => {
      if (intent?.type === 'question-write' || intent?.type === 'community-write') {
        setWriteOpen(true);
      }
    });
  }, [user]);

  const openPost = useCallback(
    (post: CommunityPost) => {
      if (
        !canViewSecretCommunityPost(post.is_secret, post.author_id, user?.id, isModerator)
      ) {
        Alert.alert('비밀글', '비밀글은 작성자만 볼 수 있습니다.');
        return;
      }
      setSelected(post);
    },
    [user?.id, isModerator],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      void goToPage(page);
      scrollToTop();
    },
    [goToPage, scrollToTop],
  );

  const handleBestToggle = useCallback(() => {
    setBestSortActive((prev) => !prev);
    scrollToTop();
  }, [scrollToTop]);

  const listPagination = (
    <CommunityListPagination
      currentPage={currentPage}
      totalCount={totalCount}
      hasMultiplePages={hasMultiplePages}
      onPageChange={handlePageChange}
      disabled={loading}
    />
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
    setEditingPost(null);
    setWriteOpen(true);
  }, [user]);

  const handleEditPost = useCallback(() => {
    if (!selected) return;
    setEditingPost({
      id: selected.id,
      title: selected.title ?? '',
      content: selected.content,
      isSecret: selected.is_secret,
    });
    setWriteOpen(true);
  }, [selected]);

  const handleDeletePost = useCallback(() => {
    if (!selected) return;
    confirmDestructiveAction(
      '질문 삭제',
      '삭제된 질문은 복구할 수 없습니다. 계속하시겠습니까?',
      async () => {
        await deleteCommunityPostByAuthor(selected.id);
        setSelected(null);
        await refresh();
      },
    );
  }, [selected, refresh]);

  const handleSaveQuestion = useCallback(
    async (input: { title: string; content: string; isSecret: boolean }) => {
      if (editingPost?.id) {
        const updated = await updateCommunityPostByAuthor(editingPost.id, {
          title: input.title,
          content: input.content,
          isSecret: input.isSecret,
        });
        const mapped = mapCommunityPostRow(updated as CommunityPost);
        if (selected?.id === editingPost.id) {
          setSelected(mapped);
        }
        setEditingPost(null);
      } else {
        await createQaPost({
          title: input.title,
          content: input.content,
          isSecret: input.isSecret,
        });
      }
      await refresh();
    },
    [editingPost, refresh, selected?.id, user],
  );

  const isSelectedAuthor = isPostAuthor(selected?.author_id, user?.id);

  const qaWriteModal = (
    <QaWriteModal
      visible={writeOpen}
      onClose={() => {
        setWriteOpen(false);
        setEditingPost(null);
      }}
      onSave={handleSaveQuestion}
      editingPost={editingPost}
    />
  );

  const loginModal = (
    <GuestLoginPromptModal
      visible={loginOpen}
      onClose={() => setLoginOpen(false)}
      title="로그인이 필요한 서비스입니다"
      description="질문을 남기시려면 로그인 또는 회원가입이 필요합니다."
      intent={{ type: loginIntent }}
      kakaoLabel="카카오 3초 로그인"
      googleLabel="구글 로그인"
    />
  );

  const listToolbar = (
    <CommunityListToolbar
      embedded
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="질문 제목·내용 검색"
    />
  );

  const listScrollHeader = isLounge ? (
    <CommunityListScrollHeader
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="질문 제목·내용 검색"
      error={error}
      bestActive={bestSortActive}
      onBestToggle={handleBestToggle}
    />
  ) : null;

  const renderAnswerSection = (variant: 'lounge' | 'default') => (
    <CommunityCommentSection
      postId={selected?.id ?? null}
      canWrite={canAnswer}
      writeDeniedMessage="답변은 구급대원 및 관리자만 작성 가능합니다."
      sectionLabel="답변"
      emptyMessage="아직 답변이 없습니다."
      placeholder="구급대원 답변을 입력해 주세요"
      submitLabel="답변 등록"
      variant={variant}
    />
  );

  if (selected) {
    if (isLounge) {
      return (
        <LoungeScreen>
          <ParamedicHeader />
          <CommunityPostDetailLayout backLabel="목록" onBack={() => setSelected(null)}>
            <LoungeCard>
              <LoungeTitle>{selected.title ?? '제목 없음'}</LoungeTitle>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <LoungeAnonymousBadge label={selected.anonymous_label} />
                <LoungeMetaText>{formatRelativeTime(selected.created_at)}</LoungeMetaText>
              </View>
              <View className="mt-4">
                <CommunityHtmlContent content={selected.content} />
              </View>
              {isSelectedAuthor ? (
                <View className="mt-4">
                  <CommunityAuthorActions
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                  />
                </View>
              ) : null}
            </LoungeCard>
            {renderAnswerSection('lounge')}
          </CommunityPostDetailLayout>
          {qaWriteModal}
          {loginModal}
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
            {isSelectedAuthor ? (
              <CommunityAuthorActions
                variant="default"
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            ) : null}
          </View>
          {renderAnswerSection('default')}
        </ScrollView>
        {qaWriteModal}
        {loginModal}
      </View>
    );
  }

  if (isLounge) {
    return (
      <LoungeScreen>
        <ParamedicHeader />

        {loading && posts.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator color={lounge.accent} />
          </View>
        ) : (
          <View className="flex-1">
            <FlatList
              ref={listRef}
              data={posts}
              extraData={`${currentPage}-${bestSortActive}`}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <QaPostCard
                  post={item}
                  onPress={() => openPost(item)}
                  onLike={handleLike}
                  lounge
                  userId={user?.id}
                  isAdmin={isModerator}
                />
              )}
              ListHeaderComponent={listScrollHeader}
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
                    {searchInput.trim() ? '검색 결과가 없습니다' : '아직 질문이 없습니다'}
                  </Text>
                </View>
              }
              ListFooterComponent={listPagination}
              contentContainerStyle={loungeListContentStyle}
            />
            <LoungeFab
              onPress={handleWritePress}
              accessibilityLabel="질문 작성"
              icon="create-outline"
            />
          </View>
        )}

        {loginModal}
        {qaWriteModal}
      </LoungeScreen>
    );
  }

  const defaultListHeader = (
    <>
      {listToolbar}
      {error ? (
        <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-kemix-bg">
      <View className="flex-1 px-4 pt-3">
        {loading && posts.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#15803d" />
          </View>
        ) : (
          <View className="flex-1">
            <FlatList
              ref={listRef}
              data={posts}
              extraData={currentPage}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <QaPostCard
                  post={item}
                  onPress={() => openPost(item)}
                  onLike={handleLike}
                  userId={user?.id}
                  isAdmin={isModerator}
                />
              )}
              ListHeaderComponent={defaultListHeader}
              ListEmptyComponent={
                <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-16">
                  <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                  <Text className="mt-3 text-sm text-kemix-text-secondary">
                    {searchInput.trim() ? '검색 결과가 없습니다' : '아직 질문이 없습니다'}
                  </Text>
                </View>
              }
              ListFooterComponent={listPagination}
              contentContainerStyle={{
                paddingTop: defaultFabListContentStyle.paddingTop,
                paddingBottom: defaultFabListContentStyle.paddingBottom,
              }}
            />
            <LoungeFab
              onPress={handleWritePress}
              accessibilityLabel="질문 작성"
              icon="create-outline"
            />
          </View>
        )}
      </View>

      {loginModal}
      {qaWriteModal}
    </SafeAreaView>
  );
}
