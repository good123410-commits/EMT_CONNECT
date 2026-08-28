import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Alert, FlatList, ScrollView, Text, View } from 'react-native';
import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';
import { EmptyState } from '@/components/EmptyState';
import { ChoseongFilterPanel } from '@/components/medicine/ChoseongFilterPanel';
import { MedicineImage } from '@/components/medicine/MedicineImage';
import { MedicineListCard } from '@/components/medicine/MedicineListCard';
import { SearchBar } from '@/components/SearchBar';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useMedicineFavorites } from '@/hooks/useMedicineFavorites';
import { navigationRef } from '@/navigation/navigationRef';
import type { MedicineInfo } from '@/services/emergencyApi';
import {
  browseLocalMedicinesByChoseong,
  getLocalMedicineCount,
  searchLocalMedicines,
} from '@/services/medicineService';
import type { MedicineChoseongFilter } from '@/utils/medicineChoseong';

type MedicineViewMode = 'all' | 'favorites';

export function ChemicalScreen() {
  return (
    <View className="flex-1 bg-kemix-bg">
      <DrugModule />
    </View>
  );
}

function DrugModule() {
  const [viewMode, setViewMode] = useState<MedicineViewMode>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MedicineInfo | null>(null);
  const [choseong, setChoseong] = useState<MedicineChoseongFilter>('전체');
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const {
    user,
    favoriteMedicines,
    loading: favoritesLoading,
    error: favoritesError,
    togglingSeq,
    isFavorite,
    toggleFavorite,
  } = useMedicineFavorites();

  useAppHeader(
    selected
      ? {
          title: selected.itemName,
          showBack: true,
          onBack: () => setSelected(null),
        }
      : null,
  );

  const trimmedQuery = query.trim();
  const isSearchMode = trimmedQuery.length >= 1;
  const totalCount = useMemo(() => getLocalMedicineCount(), []);

  const searchResults = useMemo(() => {
    if (!isSearchMode) return [];
    return searchLocalMedicines(trimmedQuery);
  }, [isSearchMode, trimmedQuery]);

  const browseResults = useMemo(() => {
    if (isSearchMode) return [];
    return browseLocalMedicinesByChoseong(choseong);
  }, [isSearchMode, choseong]);

  const allListData = isSearchMode ? searchResults : browseResults;

  const favoritesListData = useMemo(() => {
    if (!isSearchMode) return favoriteMedicines;
    const normalized = trimmedQuery.toLowerCase();
    return favoriteMedicines.filter((item) => {
      const name = item.itemName?.toLowerCase() ?? '';
      const entp = item.entpName?.toLowerCase() ?? '';
      return name.includes(normalized) || entp.includes(normalized);
    });
  }, [favoriteMedicines, isSearchMode, trimmedQuery]);

  const listData = viewMode === 'favorites' ? favoritesListData : allListData;

  const handleViewModeChange = (mode: MedicineViewMode) => {
    if (mode === 'favorites' && !user) {
      setLoginPromptOpen(true);
      return;
    }
    setViewMode(mode);
  };

  const handleToggleFavorite = async (medicine: MedicineInfo) => {
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }

    try {
      await toggleFavorite(medicine);
    } catch (err) {
      Alert.alert(
        '즐겨찾기 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  useHardwareBackHandler(() => {
    if (selected) {
      setSelected(null);
      return true;
    }
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
    return true;
  }, true);

  if (selected) {
    return (
      <>
        <MedicineDetail
          medicine={selected}
          isFavorite={isFavorite(selected.itemSeq)}
          favoriteLoading={togglingSeq === selected.itemSeq?.trim()}
          onToggleFavorite={() => void handleToggleFavorite(selected)}
          onBack={() => setSelected(null)}
        />
        <GuestLoginPromptModal
          visible={loginPromptOpen}
          onClose={() => setLoginPromptOpen(false)}
          title="나의 즐겨찾기"
          description="로그인 후 약물을 즐겨찾기에 저장할 수 있습니다."
          intent={{ type: 'medicine-favorite' }}
        />
      </>
    );
  }

  return (
    <View className="flex-1">
      <View className="border-b border-kemix-border-light bg-kemix-surface px-4 pb-2 pt-2">
        <MedicineViewModeBar value={viewMode} onChange={handleViewModeChange} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="제품명 검색 (예: 타이레놀, 게보린)"
        />
        {viewMode === 'all' && !isSearchMode ? (
          <ChoseongFilterPanel value={choseong} onChange={setChoseong} />
        ) : null}

        <View className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Text className="text-xs font-semibold text-emerald-900">
            {viewMode === 'favorites'
              ? `나의 즐겨찾기 ${favoriteMedicines.length}건`
              : `오프라인 내장 데이터 ${totalCount.toLocaleString('ko-KR')}건 · 즉시 검색`}
          </Text>
          <Text className="mt-0.5 text-[11px] text-emerald-800">
            {viewMode === 'favorites'
              ? '별(★) 아이콘으로 저장한 약물만 표시됩니다'
              : '네트워크 없이 제품명·제조사 검색이 가능합니다'}
          </Text>
        </View>

        <Text className="mt-2 text-xs text-kemix-muted">
          {viewMode === 'favorites'
            ? isSearchMode
              ? `즐겨찾기 검색 · ${listData.length}건`
              : favoritesLoading
                ? '즐겨찾기 동기화 중…'
                : `즐겨찾기 ${listData.length}건`
            : isSearchMode
              ? `'${trimmedQuery}' 검색 · ${listData.length}건`
              : choseong === '전체'
                ? `전체 목록 ${listData.length}건 · 초성 필터 또는 검색어 입력`
                : `초성 '${choseong}' · ${listData.length}건`}
        </Text>

        {favoritesError && viewMode === 'favorites' ? (
          <Text className="mt-1 text-xs text-red-600">{favoritesError}</Text>
        ) : null}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, index) =>
          `${item.itemSeq?.trim() || 'no-seq'}::${item.itemName?.trim() || 'no-name'}::${index}`
        }
        contentContainerClassName="px-4 pb-8 pt-3 gap-3"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={14}
        maxToRenderPerBatch={20}
        windowSize={8}
        removeClippedSubviews
        ListEmptyComponent={
          viewMode === 'favorites' ? (
            favoritesLoading ? (
              <Text className="py-10 text-center text-sm text-kemix-text-secondary">
                즐겨찾기를 불러오는 중…
              </Text>
            ) : (
              <EmptyState
                message={isSearchMode ? '검색 결과가 없습니다' : '즐겨찾기한 약물이 없습니다'}
                hint={
                  isSearchMode
                    ? '다른 제품명으로 검색해 보세요'
                    : '전체보기에서 별(★) 아이콘을 눌러 약물을 저장해 보세요'
                }
              />
            )
          ) : (
            <EmptyState
              message={isSearchMode ? '검색 결과가 없습니다' : '표시할 의약품이 없습니다'}
              hint={
                isSearchMode
                  ? '다른 제품명으로 검색하거나 초성 필터를 변경해 보세요'
                  : '검색어를 입력하거나 다른 초성을 선택해 보세요'
              }
            />
          )
        }
        renderItem={({ item }) => (
          <MedicineListCard
            item={item}
            isFavorite={isFavorite(item.itemSeq)}
            favoriteLoading={togglingSeq === item.itemSeq?.trim()}
            onToggleFavorite={() => void handleToggleFavorite(item)}
            onPress={() => setSelected(item)}
          />
        )}
      />

      <GuestLoginPromptModal
        visible={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        title="나의 즐겨찾기"
        description="로그인 후 약물을 즐겨찾기에 저장하고 나만의 목록을 관리할 수 있습니다."
        intent={{ type: 'medicine-favorite' }}
      />
    </View>
  );
}

function MedicineViewModeBar({
  value,
  onChange,
}: {
  value: MedicineViewMode;
  onChange: (mode: MedicineViewMode) => void;
}) {
  return (
    <View className="mb-3 flex-row rounded-xl border border-kemix-border bg-kemix-bg p-1">
      <ModeButton
        label="전체보기"
        icon="list"
        selected={value === 'all'}
        onPress={() => onChange('all')}
      />
      <ModeButton
        label="나의 즐겨찾기"
        icon="star"
        selected={value === 'favorites'}
        onPress={() => onChange('favorites')}
      />
    </View>
  );
}

function ModeButton({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-3 py-2 ${
        selected ? 'bg-blue-600' : 'bg-transparent'
      }`}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={selected ? '#ffffff' : '#64748b'} />
      <Text className={`text-xs font-bold ${selected ? 'text-white' : 'text-kemix-text-secondary'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function MedicineDetail({
  medicine,
  isFavorite,
  favoriteLoading,
  onToggleFavorite,
  onBack,
}: {
  medicine: MedicineInfo;
  isFavorite: boolean;
  favoriteLoading: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
}) {
  useHardwareBackHandler(onBack, true);
  const fabBottomInset = useGlobalFabBottomInset();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: fabBottomInset }}
    >
      <View className="mb-4 flex-row rounded-2xl border border-kemix-border bg-kemix-surface p-4">
        <MedicineImage uri={medicine.itemImage} size={96} />
        <View className="ml-4 flex-1 justify-center">
          <Text className="text-xs font-medium text-blue-600">{medicine.entpName || '의약품'}</Text>
          <Text className="mt-1 text-lg font-bold text-kemix-text">{medicine.itemName}</Text>
          <Text className="mt-1 text-xs text-kemix-muted">품목코드: {medicine.itemSeq || '-'}</Text>
        </View>
        <Pressable
          className="self-start rounded-full p-2 active:opacity-80"
          disabled={favoriteLoading}
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={26}
            color={isFavorite ? '#FBBF24' : '#94a3b8'}
          />
        </Pressable>
      </View>

      <MedicineSection title="효능·효과" body={medicine.efficacy} />
      <MedicineSection title="용법·용량" body={medicine.usage} />
      <MedicineSection title="사용 전 주의" body={medicine.warningBeforeUse} highlight="amber" />
      <MedicineSection title="주의사항" body={medicine.precautions} highlight="amber" />
      <MedicineSection title="약물 상호작용" body={medicine.interactions} />
      <MedicineSection title="부작용" body={medicine.sideEffects} highlight="red" />
      <MedicineSection title="보관법" body={medicine.storage} />

      <View className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <Text className="text-xs text-emerald-900">
          로컬 내장 데이터 · 최종 갱신 {medicine.updatedAt || '-'}
        </Text>
      </View>
    </ScrollView>
  );
}

function MedicineSection({
  title,
  body,
  highlight,
}: {
  title: string;
  body: string;
  highlight?: 'amber' | 'red';
}) {
  const text = stripHtml(body);
  if (!text) return null;

  const borderClass =
    highlight === 'red'
      ? 'border-red-200 bg-red-50'
      : highlight === 'amber'
        ? 'border-amber-200 bg-amber-50'
        : 'border-kemix-border bg-kemix-surface';

  const titleClass =
    highlight === 'red' ? 'text-red-700' : highlight === 'amber' ? 'text-amber-800' : 'text-kemix-text-secondary';

  const bodyClass =
    highlight === 'red' ? 'text-red-900' : highlight === 'amber' ? 'text-amber-900' : 'text-kemix-text';

  return (
    <View className={`mb-4 rounded-2xl border p-4 ${borderClass}`}>
      <Text className={`mb-2 text-sm font-bold uppercase tracking-wide ${titleClass}`}>{title}</Text>
      <Text className={`text-sm leading-6 ${bodyClass}`}>{text}</Text>
    </View>
  );
}
