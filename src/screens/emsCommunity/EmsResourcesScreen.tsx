import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { ResourceDetailModal } from '@/components/emsCommunity/ResourceDetailModal';
import {
  LoungeBody,
  LoungeCard,
  LoungeErrorBanner,
  LoungeFilterPill,
  LoungeFilterRow,
  LoungeMetaText,
  LoungeScreen,
  LoungeTag,
  LoungeTitle,
  LoungeTopSection,
  loungeListContent,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { getResourceCategoryLabel } from '@/constants/resourceCategories';
import { EMS_LOUNGE } from '@/constants/emsLoungeTheme';
import { useKemixResources } from '@/hooks/useKemixResources';
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
  return (
    <LoungeCard onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <LoungeTag label={getResourceCategoryLabel(resource.category)} />
          <View className="mt-3">
            <LoungeTitle numberOfLines={2}>{resource.title}</LoungeTitle>
          </View>
          {resource.description ? (
            <View className="mt-2">
              <LoungeBody numberOfLines={2}>{resource.description}</LoungeBody>
            </View>
          ) : null}
          <View className="mt-3">
            <LoungeMetaText>
              {`${formatDate(resource.created_at)} · ${formatResourceFileSize(resource.file_size)}`}
            </LoungeMetaText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={EMS_LOUNGE.textMuted} />
      </View>
    </LoungeCard>
  );
}

export function EmsResourcesScreen() {
  const { resources, loading, error } = useKemixResources();
  const [category, setCategory] = useState<string>('all');
  const [selected, setSelected] = useState<KemixResource | null>(null);

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
          <ActivityIndicator color={EMS_LOUNGE.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={loungeListContent}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="folder-open-outline" size={40} color={EMS_LOUNGE.textMuted} />
              <Text
                style={{
                  marginTop: 12,
                  fontFamily: 'Pretendard',
                  fontSize: 14,
                  color: EMS_LOUNGE.textSecondary,
                }}
              >
                등록된 자료가 없습니다.
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: 'Pretendard',
                  fontSize: 12,
                  color: EMS_LOUNGE.textMuted,
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
    </LoungeScreen>
  );
}
