import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { ResourceDetailModal } from '@/components/emsCommunity/ResourceDetailModal';
import { ResourceWriteModal } from '@/components/emsCommunity/ResourceWriteModal';
import {
  LoungeBody,
  LoungeCard,
  LoungeErrorBanner,
  LoungeFilterPill,
  LoungeFilterRow,
  LoungeMetaText,
  LoungeScreen,
  LoungeTitle,
  LoungeTopSection,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { getResourceCategoryLabel } from '@/constants/resourceCategories';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useKemixResources } from '@/hooks/useKemixResources';
import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';
import { useParamedicTabWrite } from '@/hooks/useParamedicTabWrite';
import { formatResourceFileSize } from '@/services/kemixResourceService';
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
  const loungeListContentStyle = useLoungeListContentStyle();
  const { resources, loading, error, reload } = useKemixResources();
  const { isDbAdmin } = useExpertSettingsAccess();
  const isAdmin = isDbAdmin;
  const [category, setCategory] = useState<string>('all');
  const [selected, setSelected] = useState<KemixResource | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);

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

  useParamedicTabWrite('Resources', handleFabPress);

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

  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category));
    return ['all', ...Array.from(set)];
  }, [resources]);

  const filtered = useMemo(() => {
    if (category === 'all') return resources;
    return resources.filter((r) => r.category === category);
  }, [resources, category]);

  return (
    <LoungeScreen>
      <ParamedicHeader />

      {categories.length > 1 ? (
        <LoungeTopSection>
          <LoungeFilterRow>
            {categories.map((cat) => (
              <LoungeFilterPill
                key={cat}
                label={cat === 'all' ? '전체' : getResourceCategoryLabel(cat)}
                active={category === cat}
                onPress={() => setCategory(cat)}
              />
            ))}
          </LoungeFilterRow>
        </LoungeTopSection>
      ) : null}

      {error ? <LoungeErrorBanner message={error} /> : null}

      {loading && resources.length === 0 ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator color={lounge.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={loungeListContentStyle}
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
                등록된 자료가 없습니다.
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
          renderItem={({ item }) => (
            <ResourceCard resource={item} onPress={() => setSelected(item)} />
          )}
        />
      )}

      <ResourceDetailModal
        resource={selected}
        visible={selected !== null}
        onClose={() => setSelected(null)}
      />

      <ResourceWriteModal
        visible={writeOpen}
        onClose={() => setWriteOpen(false)}
        onCreated={() => void reload()}
      />
    </LoungeScreen>
  );
}
