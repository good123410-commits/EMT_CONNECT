import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuideAdminCodeModal } from '@/components/guides/GuideAdminCodeModal';
import { GuideCategoryManageModal } from '@/components/guides/GuideCategoryManageModal';
import { buildGuideTextStyle } from '@/components/guides/GuideTypographyToolbar';
import { GuideWriteModal } from '@/components/guides/GuideWriteModal';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { GUIDE_SEVERITY_COLORS } from '@/constants/guideSeverity';
import { resolveGuideIcon, type GuideIconId } from '@/constants/guideIcons';
import { useUserRole } from '@/contexts/UserRoleContext';
import { getGuideTitleFontSize } from '@/constants/guideFonts';
import { useGuideFont } from '@/hooks/useGuideFontLoader';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import {
  subscribeGuideCategories,
  type GuideCategory,
} from '@/services/guideCategoryService';
import {
  deleteEmergencyGuide,
  fetchGuideList,
  subscribeEmergencyGuides,
  type GuideDisplay,
} from '@/services/guideService';

const ICON_MAP: Record<string, GuideIconId> = {
  heart: 'heart',
  body: 'body',
  fitness: 'fitness',
  flame: 'flame',
  water: 'water',
  pulse: 'pulse',
  snow: 'snow',
  medkit: 'medkit',
  thermometer: 'thermometer',
  bandage: 'bandage',
  skull: 'skull',
  eye: 'eye',
  warning: 'warning',
  'shield-checkmark': 'shield-checkmark',
  nutrition: 'nutrition',
  bug: 'bug',
  fish: 'fish',
  leaf: 'leaf',
  'hand-left': 'hand-left',
  walk: 'walk',
};

const ADMIN_CODE_TAP_WINDOW_MS = 900;

export function HomeScreen() {
  const [adminCodeModalVisible, setAdminCodeModalVisible] = useState(false);
  const adminTapCountRef = useRef(0);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHeaderSecretTap = () => {
    adminTapCountRef.current += 1;

    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
    adminTapTimerRef.current = setTimeout(() => {
      adminTapCountRef.current = 0;
    }, ADMIN_CODE_TAP_WINDOW_MS);

    if (adminTapCountRef.current >= 3) {
      adminTapCountRef.current = 0;
      if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
      setAdminCodeModalVisible(true);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Pressable onPress={handleHeaderSecretTap}>
          <Text className="mb-1 text-xl font-bold text-slate-900">생활 응급처치 가이드</Text>
          <Text className="text-sm text-slate-500">Supabase 실시간 · 일상 속 응급상황 대처법</Text>
        </Pressable>
      </SafeAreaView>
      <GeneralEmergencyModule />
      <GuideAdminCodeModal
        visible={adminCodeModalVisible}
        onClose={() => setAdminCodeModalVisible(false)}
      />
    </View>
  );
}

function GeneralEmergencyModule() {
  const insets = useSafeAreaInsets();
  const { isGuideAdmin } = useUserRole();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [guides, setGuides] = useState<GuideDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GuideDisplay | null>(null);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [manageCategoryVisible, setManageCategoryVisible] = useState(false);

  const loadGuides = useCallback(async (text: string, category: string) => {
    setLoading(true);
    setError(null);

    try {
      const results = await fetchGuideList(text, category);
      setCategories(results.categories);
      setGuides(results.guides);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '응급처치 가이드를 불러오지 못했습니다.';
      setError(message);
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadGuides(query, selectedCategory);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, loadGuides]);

  useEffect(() => {
    const unsubscribeGuides = subscribeEmergencyGuides(() => {
      void loadGuides(query, selectedCategory);
    });
    const unsubscribeCategories = subscribeGuideCategories(() => {
      void loadGuides(query, selectedCategory);
    });

    return () => {
      unsubscribeGuides();
      unsubscribeCategories();
    };
  }, [loadGuides, query, selectedCategory]);

  const handleDeleteGuide = useCallback(
    (guide: GuideDisplay) => {
      Alert.alert('가이드 삭제', `"${guide.title}" 글을 삭제할까요?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmergencyGuide(guide.id);
              setGuides((prev) => prev.filter((item) => item.id !== guide.id));
              if (selected?.id === guide.id) setSelected(null);
              await loadGuides(query, selectedCategory);
            } catch (err) {
              Alert.alert(
                '삭제 실패',
                err instanceof Error ? err.message : '다시 시도해 주세요.',
              );
            }
          },
        },
      ]);
    },
    [loadGuides, query, selected?.id, selectedCategory],
  );

  if (selected) {
    return (
      <GuideDetail
        guide={selected}
        isGuideAdmin={isGuideAdmin}
        onBack={() => setSelected(null)}
        onDeleted={() => {
          const deletedId = selected?.id;
          setSelected(null);
          if (deletedId) {
            setGuides((prev) => prev.filter((item) => item.id !== deletedId));
          }
          void loadGuides(query, selectedCategory);
        }}
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
          <Pressable
            className="mt-3 self-start rounded-lg bg-red-600 px-3 py-1.5"
            onPress={() => void loadGuides(query, selectedCategory)}
          >
            <Text className="text-xs font-semibold text-white">다시 시도</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && guides.length === 0 && !error ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 gap-3"
          contentContainerStyle={{ paddingBottom: isGuideAdmin ? 88 : 16 }}
          ListEmptyComponent={
            <EmptyState
              message="가이드가 없습니다"
              hint={error ? 'Supabase 테이블 설정을 확인해 주세요' : '다른 키워드로 검색해 보세요'}
            />
          }
          renderItem={({ item }) => (
            <GuideCard
              guide={item}
              isGuideAdmin={isGuideAdmin}
              onPress={() => setSelected(item)}
              onDelete={() => void handleDeleteGuide(item)}
            />
          )}
        />
      )}

      {isGuideAdmin ? (
        <Pressable
          accessibilityLabel="가이드 글쓰기"
          style={[fabStyles.button, { bottom: insets.bottom + 16 }]}
          onPress={() => setWriteModalVisible(true)}
        >
          <Text style={fabStyles.label}>📝</Text>
          <Text style={fabStyles.caption}>글쓰기</Text>
        </Pressable>
      ) : null}

      <GuideWriteModal
        visible={writeModalVisible}
        onClose={() => setWriteModalVisible(false)}
        onSaved={() => void loadGuides(query, selectedCategory)}
      />

      <GuideCategoryManageModal
        visible={manageCategoryVisible}
        categories={categories}
        onClose={() => setManageCategoryVisible(false)}
        onDeleted={(category) => {
          const wasSelected = selectedCategory === category.name;
          setCategories((prev) => prev.filter((item) => item.id !== category.id));
          if (wasSelected) {
            setSelectedCategory('');
          }
          void loadGuides(query, wasSelected ? '' : selectedCategory);
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-2"
      >
      <Pressable
        className={`rounded-full border px-3 py-2 ${
          selectedCategory === ''
            ? 'border-slate-900 bg-slate-900'
            : 'border-slate-200 bg-white'
        }`}
        onPress={() => onSelectCategory('')}
      >
        <Text
          className={`text-sm font-medium ${
            selectedCategory === '' ? 'text-white' : 'text-slate-600'
          }`}
        >
          전체
        </Text>
      </Pressable>
      {categories.map((category) => {
        const selected = selectedCategory === category.name;
        const iconName = resolveGuideIcon(category.icon);
        return (
          <Pressable
            key={category.id}
            className={`flex-row items-center rounded-full border px-3 py-2 ${
              selected ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'
            }`}
            onPress={() => onSelectCategory(category.name)}
          >
            <Ionicons
              name={iconName}
              size={14}
              color={selected ? '#dc2626' : '#64748b'}
            />
            <Text
              className={`ml-1.5 text-sm ${
                selected ? 'font-bold text-red-600' : 'font-medium text-slate-600'
              }`}
            >
              {category.name}
            </Text>
          </Pressable>
        );
      })}
      </ScrollView>
    </View>
  );
}

function GuideCard({
  guide,
  isGuideAdmin,
  onPress,
  onDelete,
}: {
  guide: GuideDisplay;
  isGuideAdmin: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const severity = GUIDE_SEVERITY_COLORS[guide.severity];
  const iconName = ICON_MAP[guide.icon] ?? resolveGuideIcon(guide.icon);

  return (
    <View className="rounded-2xl border border-slate-200 bg-white">
      <Pressable className="p-4 active:bg-slate-50" onPress={onPress}>
        <View className="flex-row items-start">
          <View className="mr-3 rounded-xl bg-red-50 p-3">
            <Ionicons name={iconName} size={28} color="#dc2626" />
          </View>
          <View className="flex-1 pr-8">
            <View className="flex-row flex-wrap items-center">
              <Text className="text-lg font-bold text-slate-900">{guide.title}</Text>
              <View
                className="ml-2 rounded-full px-2 py-0.5"
                style={{ backgroundColor: severity.bg }}
              >
                <Text className="text-xs font-semibold" style={{ color: severity.text }}>
                  {severity.label}
                </Text>
              </View>
            </View>
            <Text className="mt-0.5 text-sm text-slate-500">{guide.subtitle}</Text>
            <Text className="mt-2 text-sm leading-5 text-slate-600" numberOfLines={2}>
              {guide.summary}
            </Text>
            <View className="mt-3 flex-row items-center">
              <Text className="text-xs font-medium text-slate-400">{guide.category}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </View>
          </View>
        </View>
      </Pressable>
      {isGuideAdmin ? (
        <Pressable
          className="absolute right-3 top-3 rounded-full bg-red-50 p-2"
          onPress={onDelete}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
        </Pressable>
      ) : null}
    </View>
  );
}

function GuideDetail({
  guide,
  isGuideAdmin,
  onBack,
  onDeleted,
}: {
  guide: GuideDisplay;
  isGuideAdmin: boolean;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { fontFamily, loading: fontLoading } = useGuideFont(guide.fontId);
  const [deleting, setDeleting] = useState(false);
  const titleStyle = buildGuideTextStyle(fontFamily, getGuideTitleFontSize(guide.fontSize));
  const bodyStyle = buildGuideTextStyle(fontFamily, guide.fontSize);

  useHardwareBackHandler(onBack, true);

  const handleDelete = () => {
    Alert.alert('가이드 삭제', `"${guide.title}" 글을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteEmergencyGuide(guide.id);
            onDeleted();
            Alert.alert('삭제 완료', '가이드가 삭제되었습니다.');
          } catch (err) {
            Alert.alert(
              '삭제 실패',
              err instanceof Error ? err.message : '다시 시도해 주세요.',
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="px-4 pb-2">
        <Pressable
          className="self-start rounded-full bg-slate-100 p-2"
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (isGuideAdmin ? 96 : 32),
        }}
      >
        {fontLoading ? (
          <View className="mb-6 items-center py-8">
            <ActivityIndicator color="#0f172a" />
          </View>
        ) : (
          <>
            <Text style={{ ...titleStyle, color: '#0f172a', marginBottom: 24 }}>
              {guide.title}
            </Text>

            {guide.rawContent.split('\n').map((paragraph, index) => {
              const trimmed = paragraph.trim();
              if (!trimmed) {
                return <View key={`space-${index}`} style={{ height: 16 }} />;
              }
              return (
                <Text
                  key={`${index}-${trimmed.slice(0, 12)}`}
                  style={{ ...bodyStyle, marginBottom: 16 }}
                >
                  {trimmed}
                </Text>
              );
            })}
          </>
        )}
      </ScrollView>

      {isGuideAdmin ? (
        <View
          className="border-t border-slate-200 bg-white px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            className={`flex-row items-center justify-center rounded-xl border border-red-200 py-4 ${
              deleting ? 'bg-red-100' : 'bg-red-50'
            }`}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                <Text className="ml-2 text-sm font-bold text-red-600">이 글 삭제하기</Text>
              </>
            )}
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
    backgroundColor: '#dc2626',
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
