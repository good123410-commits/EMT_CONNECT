import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';
import { CommunityHtmlContent } from '@/components/community/CommunityHtmlContent';
import { CommunityListPagination } from '@/components/emsCommunity/CommunityListPagination';
import { CommunityBestSection } from '@/components/emsCommunity/CommunityBestSection';
import { CommunityCommentSection } from '@/components/emsCommunity/CommunityCommentSection';
import { CommunityListToolbar } from '@/components/emsCommunity/CommunityListToolbar';
import { CommunityPostDetailLayout } from '@/components/emsCommunity/CommunityPostDetailLayout';
import { QaWriteModal } from '@/components/emsCommunity/QaWriteModal';
import {
  LoungeAnonymousBadge,
  LoungeCard,
  LoungeCommentButton,
  LoungeErrorBanner,
  LoungeMetaText,
  LoungeScreen,
  LoungeTitle,
  LoungeWriteBar,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useCommunityListScrollToTop } from '@/hooks/useCommunityListScrollToTop';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { usePaginatedEmsPosts } from '@/hooks/usePaginatedEmsPosts';
import {
  createQaPost,
  formatRelativeTime,
  mapCommunityPostRow,
} from '@/services/communityService';
import type { EmsCommunityPostRow } from '@/services/emsCommunityService';
import type { CommunityPost } from '@/types/community';
import { DEFAULT_COMMUNITY_SORT_OPTIONS } from '@/types/communityList';
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

  const mapQaRow = useCallback(
    (row: EmsCommunityPostRow) => mapCommunityPostRow(row as CommunityPost),
    [],
  );

  const {
    items: posts,
    bestItems,
    sort,
    setSort,
    searchInput,
    setSearchInput,
    currentPage,
    totalCount,
    hasMultiplePages,
    loading,
    error,
    goToPage,
    refresh,
    sortOptions,
  } = usePaginatedEmsPosts<CommunityPost>({
    postTypes: ['bamboo'],
    categorySlug: 'question',
    mapRow: mapQaRow,
    sortOptions: DEFAULT_COMMUNITY_SORT_OPTIONS,
    enableBest: isLounge,
    useDailyBestRpc: isLounge,
  });

  const { listRef, scrollToTop } = useCommunityListScrollToTop<CommunityPost>();

  const [selected, setSelected] = useState<CommunityPost | null>(null);

  const [writeOpen, setWriteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginIntent, setLoginIntent] = useState<'question-write' | 'community-write'>(
    'question-write',
  );

  useEffect(() => {
    if (!user) return;
    void consumeAuthIntent().then((intent) => {
      if (intent?.type === 'question-write' || intent?.type === 'community-write') {
        setWriteOpen(true);
      }
    });
  }, [user]);

  const openPost = useCallback((post: CommunityPost) => {
    setSelected(post);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      void goToPage(page);
      scrollToTop();
    },
    [goToPage, scrollToTop],
  );

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
    setWriteOpen(true);
  }, [user]);

  const handleSaveQuestion = useCallback(
    async (input: { title: string; content: string }) => {
      await createQaPost({
        title: input.title,
        content: input.content,
        authorLabel: (user?.user_metadata?.name as string | undefined) ?? '회원',
      });
      await refresh();
    },
    [refresh, user],
  );

  const qaWriteModal = (
    <QaWriteModal
      visible={writeOpen}
      onClose={() => setWriteOpen(false)}
      onSave={handleSaveQuestion}
    />
  );

  const listToolbar = (
    <CommunityListToolbar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="질문 제목·내용 검색"
      sort={sort}
      onSortChange={setSort}
      sortOptions={sortOptions}
    />
  );

  const listBestHeader = isLounge ? (
    <CommunityBestSection
      items={bestItems}
      renderItem={(post) => (
        <QaPostCard post={post} onPress={() => openPost(post)} lounge />
      )}
    />
  ) : null;

  const renderAnswerSection = (variant: 'lounge' | 'default') => (
    <CommunityCommentSection
      postId={selected?.id ?? null}
      canWrite={canAnswer}
      writeDeniedMessage="답변은 구급대원 및 관리자만 작성 가능합니다."
      authorLabel={(user?.user_metadata?.name as string | undefined) ?? '구급대원'}
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
            </LoungeCard>
            {renderAnswerSection('lounge')}
          </CommunityPostDetailLayout>
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
          {renderAnswerSection('default')}
        </ScrollView>
      </View>
    );
  }

  if (isLounge) {
    return (
      <LoungeScreen>
        <ParamedicHeader />

        <LoungeWriteBar label="질문 작성" onPress={handleWritePress} icon="chatbubble-ellipses-outline" />

        {listToolbar}

        {error ? <LoungeErrorBanner message={error} /> : null}

        {loading && posts.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator color={lounge.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={posts}
            extraData={currentPage}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <QaPostCard post={item} onPress={() => openPost(item)} lounge />
            )}
            ListHeaderComponent={listBestHeader}
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

        {qaWriteModal}
      </LoungeScreen>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-kemix-bg">
      <View className="flex-1 px-4 pt-3">
        <Pressable
          onPress={handleWritePress}
          className="mb-3 flex-row items-center justify-center rounded-full bg-green-700 py-3 active:bg-green-800"
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text className="ml-2 font-semibold text-white">질문 작성</Text>
        </Pressable>

        {listToolbar}

        {error ? (
          <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {loading && posts.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#15803d" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={posts}
            extraData={currentPage}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <QaPostCard post={item} onPress={() => openPost(item)} />}
            ListEmptyComponent={
              <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-16">
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text className="mt-3 text-sm text-kemix-text-secondary">
                  {searchInput.trim() ? '검색 결과가 없습니다' : '아직 질문이 없습니다'}
                </Text>
              </View>
            }
            ListFooterComponent={listPagination}
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

      {qaWriteModal}
    </SafeAreaView>
  );
}
