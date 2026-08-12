import { Ionicons } from '@expo/vector-icons';

import { useCallback, useEffect, useState } from 'react';

import {

  ActivityIndicator,

  FlatList,

  Modal,

  Pressable,

  ScrollView,

  Text,

  View,

} from 'react-native';

import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';

import { CaseStudyWriteModal } from '@/components/emsCommunity/CaseStudyWriteModal';

import { RichContentRenderer } from '@/components/content/RichContentRenderer';

import { ReportContentButton } from '@/components/community/ReportContentButton';

import {

  LoungeAnonymousBadge,

  LoungeBackBar,

  LoungeCard,

  LoungeErrorBanner,

  LoungeLikeButton,

  LoungeMetaText,

  LoungeScreen,

  LoungeTitle,

  LoungeTopSection,

  LoungeWriteBar,

  useLoungeListContentStyle,

} from '@/components/emsCommunity/loungeUi';

import { ParamedicHeader } from '@/components/expert/ParamedicHeader';

import { EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

import { useAuth } from '@/contexts/AuthContext';

import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';

import { useUserRole } from '@/contexts/UserRoleContext';

import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';

import { useParamedicTabWrite } from '@/hooks/useParamedicTabWrite';

import type { CaseStudyPost } from '@/data/paramedicMockData';

import { consumeAuthIntent } from '@/utils/authIntent';

import { PARAMEDIC_SPACE_GATE_MESSAGE } from '@/utils/membershipRbac';



function CaseStudyCard({

  post,

  onLike,

  onOpen,

}: {

  post: CaseStudyPost;

  onLike: (id: string) => void;

  onOpen: (post: CaseStudyPost) => void;

}) {

  const { lounge } = useEmsLoungeTheme();



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

              <LoungeAnonymousBadge label={post.anonymousLabel} />

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

        <LoungeLikeButton count={post.likes} onPress={() => void onLike(post.id)} />

      </View>

    </LoungeCard>

  );

}



export function EmsCaseStudyScreen() {

  const { lounge } = useEmsLoungeTheme();

  const loungeListContentStyle = useLoungeListContentStyle();

  const loungeComposeContentStyle = useLoungeListContentStyle(24);

  const { user } = useAuth();

  const { canAccessParamedicChannel } = useUserRole();

  const {

    caseStudies,

    postCaseStudy,

    likeCaseStudy,

    loading,

    error,

  } = useParamedicCommunity();

  const [writeOpen, setWriteOpen] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);

  const [permissionOpen, setPermissionOpen] = useState(false);

  const [selected, setSelected] = useState<CaseStudyPost | null>(null);



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

    setWriteOpen(true);

  }, [user, canAccessParamedicChannel]);



  useParamedicTabWrite('CaseStudy', handleWritePress);



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



  const handleSubmitCase = async (input: { title: string; summary: string; body: string }) => {

    await postCaseStudy(input.title, input.summary || input.body.slice(0, 80), input.body);

  };



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

        onClose={() => setWriteOpen(false)}

        onSubmit={handleSubmitCase}

      />

    </>

  );



  if (selected) {

    return (

      <LoungeScreen>

        <ParamedicHeader />

        <ScrollView contentContainerStyle={loungeComposeContentStyle}>

          <LoungeBackBar label="목록" onPress={() => setSelected(null)} />

          <View style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}>

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

                <LoungeAnonymousBadge label={selected.anonymousLabel} />

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

            </LoungeCard>

          </View>

        </ScrollView>

        {overlays}

      </LoungeScreen>

    );

  }



  return (

    <LoungeScreen>

      <ParamedicHeader />



      <LoungeTopSection>

        <LoungeWriteBar label="케이스 작성" onPress={handleWritePress} icon="create-outline" />

      </LoungeTopSection>



      {error ? <LoungeErrorBanner message={error} /> : null}



      {loading && caseStudies.length === 0 ? (

        <View className="flex-1 items-center justify-center py-16">

          <ActivityIndicator color={lounge.accent} />

        </View>

      ) : (

        <FlatList

          data={caseStudies}

          keyExtractor={(item) => item.id}

          contentContainerStyle={loungeListContentStyle}

          ListEmptyComponent={

            <View className="items-center py-12">

              <Text style={{ color: lounge.textSecondary, fontFamily: 'Pretendard' }}>

                등록된 케이스가 없습니다.

              </Text>

            </View>

          }

          renderItem={({ item }) => (

            <CaseStudyCard post={item} onLike={likeCaseStudy} onOpen={setSelected} />

          )}

        />

      )}



      {overlays}

    </LoungeScreen>

  );

}


