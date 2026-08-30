import { Ionicons } from '@expo/vector-icons';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Pressable, ActivityIndicator, Alert, FlatList, Modal, Text, View } from 'react-native';

import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';

import { CaseStudyWriteModal } from '@/components/emsCommunity/CaseStudyWriteModal';
import { CommunityAuthorActions } from '@/components/emsCommunity/CommunityAuthorActions';
import { CommunityListPagination } from '@/components/emsCommunity/CommunityListPagination';
import { CommunityCommentSection } from '@/components/emsCommunity/CommunityCommentSection';
import { CommunityListScrollHeader } from '@/components/emsCommunity/CommunityListScrollHeader';
import { CommunityPostDetailLayout } from '@/components/emsCommunity/CommunityPostDetailLayout';

import { RichContentRenderer } from '@/components/content/RichContentRenderer';

import { ReportContentButton } from '@/components/community/ReportContentButton';

import {

  LoungeAnonymousBadge,

  LoungeCard,

  LoungeLikeButton,

  LoungeMetaText,

  LoungeFab,

  LoungeScreen,

  LoungeTitle,

  useLoungeListContentStyle,

} from '@/components/emsCommunity/loungeUi';

import { ParamedicHeader } from '@/components/expert/ParamedicHeader';

import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

import { useAuth } from '@/contexts/AuthContext';

import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';

import { useUserRole } from '@/contexts/UserRoleContext';

import { useCommunityListScrollToTop } from '@/hooks/useCommunityListScrollToTop';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useCommunityPostLike } from '@/hooks/useCommunityPostLike';
import { usePaginatedEmsPosts } from '@/hooks/usePaginatedEmsPosts';
import { mapRowToCaseStudy } from '@/services/emsCommunityService';
import {
  deleteCommunityPostByAuthor,
  updateCommunityPostByAuthor,
} from '@/services/communityAuthorService';
import type { CaseStudyPost } from '@/data/paramedicMockData';
import { isPostLiked } from '@/utils/communityPostLike';

import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { consumeAuthIntent } from '@/utils/authIntent';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';
import { isPostAuthor } from '@/utils/communityPostAccess';

import { PARAMEDIC_SPACE_GATE_MESSAGE } from '@/utils/membershipRbac';



function CaseStudyCard({

  post,

  onLike,

  onOpen,

  onAuthorBlocked,

}: {

  post: CaseStudyPost;

  onLike: (post: CaseStudyPost) => void;

  onOpen: (post: CaseStudyPost) => void;

  onAuthorBlocked?: () => void;

}) {

  const { lounge } = useEmsLoungeTheme();

  const liked = isPostLiked(post);



  return (

    <LoungeCard>

      <Pressable className="active:opacity-95" onPress={() => onOpen(post)}>

        <View className="flex-row items-center justify-between">

          <View className="flex-1 pr-3">

            <LoungeTitle numberOfLines={1}>{post.title}</LoungeTitle>

            {post.summary ? (

              <Text

                className="mt-1 text-sm"

                numberOfLines={2}

                style={{ color: lounge.textSecondary, fontFamily: 'Pretendard' }}

              >

                {post.summary}

              </Text>

            ) : null}

            <View className="mt-2 flex-row items-center gap-2">

              <LoungeAnonymousBadge
                label={post.anonymousLabel}
                authorId={post.authorId}
                onBlocked={onAuthorBlocked}
              />

              <LoungeMetaText>{post.postedAt}</LoungeMetaText>

            </View>

          </View>

          <Ionicons name="chevron-forward" size={16} color={lounge.textMuted} />

        </View>

      </Pressable>

      <View

        className="mt-3 flex-row justify-end border-t pt-3"

        style={{ borderTopColor: lounge.border }}

      >

        <LoungeLikeButton
          count={post.likes}
          liked={liked}
          onPress={() => onLike(post)}
        />

      </View>

    </LoungeCard>

  );

}



export function EmsCaseStudyScreen() {

  const { lounge } = useEmsLoungeTheme();

  const loungeListContentStyle = useLoungeListContentStyle(12, true);

  const { user } = useAuth();

  const { canAccessParamedicChannel } = useUserRole();

  const {

    postCaseStudy,

    error: feedError,

  } = useParamedicCommunity();

  const [writeOpen, setWriteOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseStudyPost | null>(null);
  const [bestSortActive, setBestSortActive] = useState(false);

  const {
    items: caseStudies,
    searchInput,
    setSearchInput,
    currentPage,
    totalCount,
    hasMultiplePages,
    loading,
    error: listError,
    goToPage,
    refresh: refreshList,
    patchPost,
  } = usePaginatedEmsPosts({
    postTypes: ['case_study'],
    mapRow: mapRowToCaseStudy,
    sort: bestSortActive ? 'popular' : 'latest',
  });

  const { isBlocked, reload: reloadBlockedUsers } = useBlockedUsers();

  const visibleCaseStudies = useMemo(
    () =>
      caseStudies.filter(
        (post) =>
          !isBlocked({
            authorId: post.authorId,
            anonymousLabel: post.anonymousLabel,
          }),
      ),
    [caseStudies, isBlocked],
  );

  const error = listError ?? feedError;

  const { listRef, scrollToTop } = useCommunityListScrollToTop<CaseStudyPost>();

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

  const [loginOpen, setLoginOpen] = useState(false);

  const [permissionOpen, setPermissionOpen] = useState(false);

  const [selected, setSelected] = useState<CaseStudyPost | null>(null);

  const handleAuthorBlocked = useCallback(() => {
    void reloadBlockedUsers();
    void refreshList();
    setSelected(null);
  }, [refreshList, reloadBlockedUsers]);

  const patchPostEverywhere = useCallback(
    (id: string, updater: (prev: CaseStudyPost) => CaseStudyPost) => {
      patchPost(id, updater);
      setSelected((prev) => (prev?.id === id ? updater(prev) : prev));
    },
    [patchPost],
  );

  const { toggleLike: handleLike } = useCommunityPostLike<CaseStudyPost>({
    patchPost: patchPostEverywhere,
    canLike: () => Boolean(user),
    onAuthRequired: () => setLoginOpen(true),
    onError: (message) => Alert.alert('좋아요', message),
  });



  useEffect(() => {

    if (!user) return;

    void consumeAuthIntent().then((intent) => {

      if (intent?.type === 'community-write') {

        setWriteOpen(true);

      }

    });

  }, [user]);



  const handleWritePress = useCallback(() => {

    if (!user) {

      setLoginOpen(true);

      return;

    }

    if (!canAccessParamedicChannel) {

      setPermissionOpen(true);

      return;

    }

    setEditingCase(null);
    setWriteOpen(true);

  }, [user, canAccessParamedicChannel]);

  useHardwareBackHandler(() => {

    if (permissionOpen) {

      setPermissionOpen(false);

      return true;

    }

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



  const handleSaveCase = async (input: { title: string; summary: string; body: string }) => {
    if (editingCase?.id) {
      const updated = await updateCommunityPostByAuthor(editingCase.id, {
        title: input.title,
        summary: input.summary || input.body.slice(0, 80),
        content: input.body,
      });
      const mapped = mapRowToCaseStudy(updated);
      if (selected?.id === editingCase.id) {
        setSelected(mapped);
      }
      setEditingCase(null);
    } else {
      await postCaseStudy(input.title, input.summary || input.body.slice(0, 80), input.body);
    }
    await refreshList();
    scrollToTop();
  };

  const handleEditCase = () => {
    if (!selected) return;
    setEditingCase(selected);
    setWriteOpen(true);
  };

  const handleDeleteCase = () => {
    if (!selected) return;
    confirmDestructiveAction(
      '케이스 삭제',
      '삭제된 케이스는 복구할 수 없습니다. 계속하시겠습니까?',
      async () => {
        await deleteCommunityPostByAuthor(selected.id);
        setSelected(null);
        await refreshList();
      },
    );
  };

  const isSelectedAuthor = isPostAuthor(selected?.authorId, user?.id);



  const overlays = (

    <>

      <GuestLoginPromptModal

        visible={loginOpen}

        onClose={() => setLoginOpen(false)}

        title="로그인이 필요한 서비스입니다"

        description="케이스를 작성하려면 로그인 또는 회원가입이 필요합니다."

        intent={{ type: 'community-write' }}

        kakaoLabel="카카오 3초 로그인"

        googleLabel="구글 로그인"

      />



      <Modal

        visible={permissionOpen}

        transparent

        animationType="fade"

        onRequestClose={() => setPermissionOpen(false)}

      >

        <Pressable

          className="flex-1 items-center justify-center bg-black/40 px-6"

          onPress={() => setPermissionOpen(false)}

        >

          <Pressable

            className="w-full max-w-sm rounded-2xl p-5"

            style={{ backgroundColor: lounge.surface }}

            onPress={(event) => event.stopPropagation()}

          >

            <Text

              style={{

                fontFamily: 'Pretendard-Bold',

                fontSize: 17,

                color: lounge.text,

                marginBottom: 8,

              }}

            >

              권한 안내

            </Text>

            <Text

              style={{

                fontFamily: 'Pretendard',

                fontSize: 14,

                lineHeight: 22,

                color: lounge.textSecondary,

              }}

            >

              {PARAMEDIC_SPACE_GATE_MESSAGE}

            </Text>

            <Pressable

              className="mt-4 items-center rounded-xl py-3 active:opacity-90"

              style={{ backgroundColor: lounge.accent }}

              onPress={() => setPermissionOpen(false)}

            >

              <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 14, color: '#fff' }}>

                확인

              </Text>

            </Pressable>

          </Pressable>

        </Pressable>

      </Modal>



      <CaseStudyWriteModal

        visible={writeOpen}

        onClose={() => {
          setWriteOpen(false);
          setEditingCase(null);
        }}

        onSubmit={handleSaveCase}

        editingPost={editingCase}

      />

    </>

  );



  if (selected) {

    return (

      <LoungeScreen>

        <ParamedicHeader />

        <CommunityPostDetailLayout backLabel="목록" onBack={() => setSelected(null)}>

          <LoungeCard>

            <LoungeTitle>{selected.title}</LoungeTitle>

            {selected.summary ? (

              <Text

                className="mt-2 text-sm leading-6"

                style={{ color: lounge.textSecondary, fontFamily: 'Pretendard' }}

              >

                {selected.summary}

              </Text>

            ) : null}

            <View className="mt-2 flex-row flex-wrap items-center gap-2">

              <LoungeAnonymousBadge
                label={selected.anonymousLabel}
                authorId={selected.authorId}
                onBlocked={handleAuthorBlocked}
              />

              <LoungeMetaText>{selected.postedAt}</LoungeMetaText>

            </View>

            <View className="mt-4">

              <RichContentRenderer content={selected.body} />

            </View>

            <View className="mt-4 flex-row justify-end">
              <ReportContentButton
                contentId={selected.id}
                contentType="post"
                preview={selected.title}
              />
            </View>

            {isSelectedAuthor ? (
              <CommunityAuthorActions onEdit={handleEditCase} onDelete={handleDeleteCase} />
            ) : null}
          </LoungeCard>

          <CommunityCommentSection

            postId={selected.id}

            canWrite={Boolean(user)}

            writeDeniedMessage="댓글을 작성하려면 로그인이 필요합니다."

            sectionLabel="댓글"

            placeholder="케이스에 대한 의견을 남겨 주세요"

            submitLabel="댓글 등록"

          />

        </CommunityPostDetailLayout>

        {overlays}

      </LoungeScreen>

    );

  }



  return (

    <LoungeScreen>

      <ParamedicHeader />

      {loading && visibleCaseStudies.length === 0 ? (

        <View className="flex-1 items-center justify-center py-16">

          <ActivityIndicator color={lounge.accent} />

        </View>

      ) : (

        <View className="flex-1">

        <FlatList

          ref={listRef}

          data={visibleCaseStudies}

          extraData={`${currentPage}-${bestSortActive}`}

          keyExtractor={(item) => item.id}

          contentContainerStyle={loungeListContentStyle}

          ListHeaderComponent={
            <CommunityListScrollHeader
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              searchPlaceholder="케이스 제목·내용 검색"
              error={error}
              bestActive={bestSortActive}
              onBestToggle={handleBestToggle}
            />
          }

          ListEmptyComponent={

            <View className="items-center py-12">

              <Text style={{ color: lounge.textSecondary, fontFamily: 'Pretendard' }}>

                {searchInput.trim() ? '검색 결과가 없습니다' : '등록된 케이스가 없습니다.'}

              </Text>

            </View>

          }

          ListFooterComponent={
            <CommunityListPagination
              currentPage={currentPage}
              totalCount={totalCount}
              hasMultiplePages={hasMultiplePages}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          }

          renderItem={({ item }) => (

            <CaseStudyCard
              post={item}
              onLike={handleLike}
              onOpen={setSelected}
              onAuthorBlocked={handleAuthorBlocked}
            />

          )}

        />

        <LoungeFab
          onPress={handleWritePress}
          accessibilityLabel="케이스 작성"
          icon="create-outline"
        />

        </View>

      )}

      {overlays}
    </LoungeScreen>

  );

}


