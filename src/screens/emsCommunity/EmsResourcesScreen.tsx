import { Ionicons } from '@expo/vector-icons';

import { useCallback, useEffect, useState } from 'react';

import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';

import { ResourceDetailModal } from '@/components/emsCommunity/ResourceDetailModal';

import { ResourceWriteModal } from '@/components/emsCommunity/ResourceWriteModal';

import type { ResourceWriteInput } from '@/components/emsCommunity/ResourceWriteModal';

import { CommunityBestSection } from '@/components/emsCommunity/CommunityBestSection';

import { CommunityListPagination } from '@/components/emsCommunity/CommunityListPagination';

import { CommunityListScrollHeader } from '@/components/emsCommunity/CommunityListScrollHeader';

import {

  LoungeCard,

  LoungeFab,

  LoungeMetaText,

  LoungeScreen,

  LoungeTitle,

  useLoungeListContentStyle,

} from '@/components/emsCommunity/loungeUi';

import { ParamedicHeader } from '@/components/expert/ParamedicHeader';

import { getResourceCategoryLabel } from '@/constants/resourceCategories';

import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';

import { useClientCommunityList } from '@/hooks/useClientCommunityList';

import { useCommunityListScrollToTop } from '@/hooks/useCommunityListScrollToTop';

import { useKemixResources } from '@/hooks/useKemixResources';

import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';

import { adminUpsertKemixResource, formatResourceFileSize } from '@/services/kemixResourceService';

import type { KemixResource } from '@/types/kemixResource';



function formatDate(iso: string) {

  return new Date(iso).toLocaleDateString('ko-KR');

}



function ResourceCard({

  resource,

  onPress,

}: {

  resource: KemixResource;

  onPress: () => void;

}) {

  const { lounge } = useEmsLoungeTheme();

  return (

    <LoungeCard onPress={onPress}>

      <View className="flex-row items-center justify-between">

        <View className="flex-1 pr-3">

          <LoungeTitle numberOfLines={1}>{resource.title}</LoungeTitle>

          <View className="mt-1 flex-row items-center gap-2">

            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: lounge.accentMuted }}>

              <Text style={{ fontFamily: 'Pretendard-Medium', fontSize: 11, color: lounge.accentSoft }}>

                {getResourceCategoryLabel(resource.category)}

              </Text>

            </View>

            <LoungeMetaText>

              {`${formatDate(resource.created_at)} · ${formatResourceFileSize(resource.file_size)}`}

            </LoungeMetaText>

          </View>

        </View>

        <Ionicons name="chevron-forward" size={16} color={lounge.textMuted} />

      </View>

    </LoungeCard>

  );

}



export function EmsResourcesScreen() {

  const { lounge } = useEmsLoungeTheme();

  const loungeListContentStyle = useLoungeListContentStyle(12, true);

  const { resources, loading, error, reload } = useKemixResources();

  const { isDbAdmin } = useExpertSettingsAccess();

  const isAdmin = isDbAdmin;

  const [selected, setSelected] = useState<KemixResource | null>(null);

  const [writeOpen, setWriteOpen] = useState(false);



  const {

    items: filtered,

    bestItems,

    searchInput,

    setSearchInput,

    currentPage,

    totalCount,

    hasMultiplePages,

    goToPage,

  } = useClientCommunityList({

    data: resources,

    searchText: (resource) => `${resource.title} ${resource.description}`,

    sortCompare: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),

    pickBest: (items) =>

      [...items].sort((a, b) => a.display_order - b.display_order).slice(0, 3),

  });



  const { listRef, scrollToTop } = useCommunityListScrollToTop<KemixResource>();



  const handleFabPress = useCallback(() => {

    if (isAdmin) {

      setWriteOpen(true);

      return;

    }

    Alert.alert(

      '권한 안내',

      '자료 등록은 DB 관리자 승인 계정만 가능합니다.\n필요한 자료가 있으면 질문함에 요청해 주세요.',

    );

  }, [isAdmin]);



  const handleSaveArchive = useCallback(

    async (input: ResourceWriteInput) => {

      await adminUpsertKemixResource({

        title: input.title,

        description: input.description,

        category: input.category,

        fileUrl: input.fileUrl,

        fileName: input.fileName,

        isPublished: true,

      });

      await reload();

    },

    [reload],

  );



  const handlePageChange = useCallback(

    (page: number) => {

      goToPage(page);

      scrollToTop();

    },

    [goToPage, scrollToTop],

  );



  useHardwareBackHandler(() => {

    if (writeOpen) {

      setWriteOpen(false);

      return true;

    }

    if (selected) {

      setSelected(null);

      return true;

    }

    return false;

  });



  useEffect(() => {

    if (__DEV__ && !loading) {

      console.log('[EmsResources] kemix_resources loaded', {

        count: resources.length,

        error,

      });

    }

  }, [resources.length, loading, error]);



  return (

    <LoungeScreen>

      <ParamedicHeader />



      {loading && resources.length === 0 ? (

        <View className="flex-1 items-center justify-center py-16">

          <ActivityIndicator color={lounge.accent} />

        </View>

      ) : (

        <View className="flex-1">

        <FlatList

          ref={listRef}

          data={filtered}

          extraData={currentPage}

          keyExtractor={(item) => item.id}

          contentContainerStyle={loungeListContentStyle}

          ListHeaderComponent={

            <CommunityListScrollHeader

              searchValue={searchInput}

              onSearchChange={setSearchInput}

              searchPlaceholder="자료 제목·설명 검색"

              error={error}

            >

              <CommunityBestSection

                items={bestItems}

                renderItem={(resource) => (

                  <ResourceCard resource={resource} onPress={() => setSelected(resource)} />

                )}

              />

            </CommunityListScrollHeader>

          }

          ListEmptyComponent={

            <View className="items-center py-12">

              <Ionicons name="folder-open-outline" size={40} color={lounge.textMuted} />

              <Text

                style={{

                  marginTop: 12,

                  fontFamily: 'Pretendard',

                  fontSize: 14,

                  color: lounge.textSecondary,

                }}

              >

                {searchInput.trim() ? '검색 결과가 없습니다' : '등록된 자료가 없습니다.'}

              </Text>

              <Text

                style={{

                  marginTop: 6,

                  fontFamily: 'Pretendard',

                  fontSize: 12,

                  color: lounge.textMuted,

                  textAlign: 'center',

                }}

              >

                KEMIX 웹 자료실과 동일한 자료가 표시됩니다.

              </Text>

            </View>

          }

          ListFooterComponent={

            <CommunityListPagination

              currentPage={currentPage}

              totalCount={totalCount}

              hasMultiplePages={hasMultiplePages}

              onPageChange={handlePageChange}

            />

          }

          renderItem={({ item }) => (

            <ResourceCard resource={item} onPress={() => setSelected(item)} />

          )}

        />

        <LoungeFab
          onPress={handleFabPress}
          accessibilityLabel="자료 업로드"
          icon="create-outline"
        />

        </View>

      )}

      <ResourceDetailModal
        resource={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
      />

      <ResourceWriteModal

        visible={writeOpen}

        onClose={() => setWriteOpen(false)}

        onSave={handleSaveArchive}

      />

    </LoungeScreen>

  );

}


