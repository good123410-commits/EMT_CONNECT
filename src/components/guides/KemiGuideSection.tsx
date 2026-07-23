import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { GuideCategoryManageModal } from '@/components/guides/GuideCategoryManageModal';
import { GuideContentGate } from '@/components/guides/GuideContentGate';
import { GuideWriteModal, type GuideWriteDraft } from '@/components/guides/GuideWriteModal';
import { resolveGuideIcon } from '@/constants/guideIcons';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useKemiGuides } from '@/hooks/useKemiGuides';
import {
  deleteKemiGuide,
  fetchGuideBySlug,
  formatKemiPostDate,
  type KemiGuideSummary,
} from '@/services/kemiPostService';
import {
  fetchGuideCategories,
  subscribeGuideCategories,
  type GuideCategory,
} from '@/services/guideCategoryService';
import type { KemiGuide } from '@/types/kemiGuide';
import { parseGuideContent } from '@/utils/guideContentFormat';

export function KemiGuideSection() {
  const insets = useSafeAreaInsets();
  const { isGuideAdmin } = useUserRole();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<KemiGuide | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [editingDraft, setEditingDraft] = useState<GuideWriteDraft | null>(null);
  const [manageCategoryVisible, setManageCategoryVisible] = useState(false);

  const { guides, loading, error, reload } = useKemiGuides({
    limit: 80,
    category: selectedCategory || null,
    search,
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await fetchGuideCategories());
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
    const unsubscribe = subscribeGuideCategories(() => {
      void loadCategories();
    });
    return unsubscribe;
  }, [loadCategories]);

  useEffect(() => {
    if (!selectedSlug) {
      setSelectedGuide(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setDetailLoading(true);
      const row = await fetchGuideBySlug(selectedSlug);
      if (!cancelled) {
        setSelectedGuide(row);
        setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const openCreateModal = () => {
    setEditingDraft(null);
    setWriteModalVisible(true);
  };

  const openEditModal = (guide: KemiGuide) => {
    const { body } = parseGuideContent(guide.content);
    setEditingDraft({
      id: guide.id,
      title: guide.title,
      category: guide.category ?? '기타',
      content: body,
      severity: 'moderate',
      fontId: 'pretendard',
      fontSize: 16,
    });
    setWriteModalVisible(true);
  };

  const handleDeleteGuide = (guide: KemiGuide) => {
    Alert.alert('가이드 삭제', `"${guide.title}" 글을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteKemiGuide(guide.id);
            setSelectedSlug(null);
            await reload();
          } catch (err) {
            Alert.alert('삭제 실패', err instanceof Error ? err.message : '다시 시도해 주세요.');
          }
        },
      },
    ]);
  };

  if (selectedSlug) {
    return (
      <GuideDetailView
        guide={selectedGuide}
        loading={detailLoading}
        isGuideAdmin={isGuideAdmin}
        onBack={() => setSelectedSlug(null)}
        onEdit={() => selectedGuide && openEditModal(selectedGuide)}
        onDelete={() => selectedGuide && handleDeleteGuide(selectedGuide)}
      />
    );
  }

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="제목, 분류, 내용 검색..."
          loading={loading}
        />
        <GuideCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isGuideAdmin={isGuideAdmin}
          onManageCategories={() => setManageCategoryVisible(true)}
        />
      </View>

      {error ? (
        <View className="mx-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <Text className="text-sm text-red-700">{error}</Text>
          <Pressable className="mt-3 self-start rounded-lg bg-red-600 px-3 py-1.5" onPress={() => void reload()}>
            <Text className="text-xs font-semibold text-white">다시 시도</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && guides.length === 0 && !error ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#047857" />
          <Text className="mt-2 text-xs text-slate-400">생활 응급처치 가이드 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4"
          contentContainerStyle={{ paddingBottom: isGuideAdmin ? insets.bottom + 88 : insets.bottom + 16 }}
          ListEmptyComponent={
            <EmptyState
              message="가이드가 없습니다"
              hint="KEMIX 웹·앱에서 동일한 콘텐츠가 표시됩니다"
            />
          }
          renderItem={({ item }) => (
            <GuideListCard guide={item} onPress={() => setSelectedSlug(item.slug)} />
          )}
        />
      )}

      {isGuideAdmin ? (
        <Pressable
          accessibilityLabel="가이드 글쓰기"
          style={[fabStyles.button, { bottom: insets.bottom + 16 }]}
          onPress={openCreateModal}
        >
          <Text style={fabStyles.label}>📝</Text>
          <Text style={fabStyles.caption}>글쓰기</Text>
        </Pressable>
      ) : null}

      <GuideWriteModal
        visible={writeModalVisible}
        editingGuide={editingDraft}
        onClose={() => {
          setWriteModalVisible(false);
          setEditingDraft(null);
        }}
        onSaved={() => {
          void reload();
          setWriteModalVisible(false);
          setEditingDraft(null);
        }}
      />

      <GuideCategoryManageModal
        visible={manageCategoryVisible}
        categories={categories}
        onClose={() => setManageCategoryVisible(false)}
        onDeleted={(category) => {
          if (selectedCategory === category.name) {
            setSelectedCategory('');
          }
          void loadCategories();
          void reload();
        }}
      />
    </View>
  );
}

function GuideCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  isGuideAdmin,
  onManageCategories,
}: {
  categories: GuideCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isGuideAdmin: boolean;
  onManageCategories: () => void;
}) {
  return (
    <View className="mt-3">
      {isGuideAdmin ? (
        <Pressable
          className="mb-2 self-end flex-row items-center rounded-full bg-slate-100 px-3 py-1.5"
          onPress={onManageCategories}
        >
          <Ionicons name="settings-outline" size={14} color="#475569" />
          <Text className="ml-1 text-xs font-bold text-slate-600">분류 관리</Text>
        </Pressable>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2">
        <CategoryChip label="전체" selected={selectedCategory === ''} onPress={() => onSelectCategory('')} />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            icon={category.icon}
            selected={selectedCategory === category.name}
            onPress={() => onSelectCategory(category.name)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryChip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`flex-row items-center rounded-full border px-3 py-2 ${
        selected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'
      }`}
      onPress={onPress}
    >
      {icon ? (
        <Ionicons
          name={resolveGuideIcon(icon)}
          size={14}
          color={selected ? '#047857' : '#64748b'}
        />
      ) : null}
      <Text
        className={`${icon ? 'ml-1.5' : ''} text-sm ${
          selected ? 'font-bold text-emerald-700' : 'font-medium text-slate-600'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function GuideListCard({ guide, onPress }: { guide: KemiGuideSummary; onPress: () => void }) {
  return (
    <Pressable className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onPress={onPress}>
      {guide.thumbnail_url ? (
        <Image
          source={{ uri: guide.thumbnail_url }}
          style={{ width: '100%', height: 140, borderRadius: 12, marginBottom: 12 }}
          resizeMode="cover"
        />
      ) : null}
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-base font-bold text-slate-900">{guide.title}</Text>
        {guide.category ? (
          <Text className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {guide.category}
          </Text>
        ) : null}
      </View>
      <Text className="mt-1 text-xs text-slate-500">{formatKemiPostDate(guide.created_at)}</Text>
      {guide.summary || guide.seo_description ? (
        <Text className="mt-2 text-sm text-slate-600" numberOfLines={2}>
          {guide.summary ?? guide.seo_description}
        </Text>
      ) : null}
    </Pressable>
  );
}

function GuideDetailView({
  guide,
  loading,
  isGuideAdmin,
  onBack,
  onEdit,
  onDelete,
}: {
  guide: KemiGuide | null;
  loading: boolean;
  isGuideAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  useHardwareBackHandler(onBack, true);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
        <Pressable className="rounded-full bg-slate-100 p-2" onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text className="text-sm font-semibold text-slate-700">생활 응급처치 가이드</Text>
        <View className="w-9" />
      </View>

      {loading || !guide ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#047857" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + (isGuideAdmin ? 96 : 24) }}
        >
          {guide.category ? (
            <Text className="mb-2 self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {guide.category}
            </Text>
          ) : null}
          <Text className="text-xl font-bold text-slate-900">{guide.title}</Text>
          <Text className="mt-1 text-xs text-slate-500">
            {formatKemiPostDate(guide.created_at)} · 조회 {guide.views}
          </Text>
          {guide.thumbnail_url ? (
            <Image
              source={{ uri: guide.thumbnail_url }}
              style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 16 }}
              resizeMode="cover"
            />
          ) : null}
          <View className="mt-4">
            <GuideContentGate
              slug={guide.slug}
              content={guide.content}
              summary={guide.summary ?? guide.seo_description}
            />
          </View>
        </ScrollView>
      )}

      {isGuideAdmin && guide ? (
        <View
          className="border-t border-slate-200 bg-white px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12, gap: 10 }}
        >
          <Pressable
            className="flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-4"
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={18} color="#334155" />
            <Text className="ml-2 text-sm font-bold text-slate-700">수정하기</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 py-4"
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
            <Text className="ml-2 text-sm font-bold text-red-600">이 글 삭제하기</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const fabStyles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#047857',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 16,
  },
  caption: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
