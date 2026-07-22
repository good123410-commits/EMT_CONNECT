import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '@/components/BackHeader';
import { EmptyState } from '@/components/EmptyState';
import { ChoseongFilterPanel } from '@/components/medicine/ChoseongFilterPanel';
import { MedicineImage } from '@/components/medicine/MedicineImage';
import { SearchBar } from '@/components/SearchBar';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { EmergencyApiError, type MedicineInfo } from '@/services/emergencyApi';
import {
  applyChoseongFilter,
  BROWSE_PAGE_SIZE,
  CHOSEONG_BROWSE_COUNT,
  loadDefaultMedicines,
  loadMedicineBrowsePool,
  loadMoreMedicines,
  searchMedicinesByName,
} from '@/services/medicineService';
import type { MedicineChoseongFilter } from '@/utils/medicineChoseong';

export function ChemicalScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="mb-1 text-xl font-bold text-slate-900">의약품 검색</Text>
        <Text className="text-sm text-slate-500">e약은요 · 낱알 이미지 · 초성 필터</Text>
      </SafeAreaView>
      <DrugModule />
    </View>
  );
}

function DrugModule() {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<MedicineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MedicineInfo | null>(null);
  const [choseong, setChoseong] = useState<MedicineChoseongFilter>('전체');
  const [browsePage, setBrowsePage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadSeq = useRef(0);

  const trimmedQuery = query.trim();
  const isSearchMode = trimmedQuery.length >= 2;
  const isBrowseMode = !isSearchMode;

  const filteredData = useMemo(
    () => applyChoseongFilter(medicines, choseong),
    [medicines, choseong],
  );

  useEffect(() => {
    const tachionItems = filteredData.filter((item) =>
      item.itemName?.trim().includes('타치온'),
    );
    console.log('[DrugSearch] filteredData', {
      choseong,
      isSearchMode,
      total: filteredData.length,
      tachionCount: tachionItems.length,
      tachionNames: tachionItems.map((item) => item.itemName),
      preview: filteredData.slice(0, 8).map((item) => item.itemName),
    });
  }, [filteredData, choseong, isSearchMode]);

  const loadBrowseData = useCallback(async (filter: MedicineChoseongFilter) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    setMedicines([]);

    try {
      const results =
        filter === '전체'
          ? await loadDefaultMedicines()
          : await loadMedicineBrowsePool(CHOSEONG_BROWSE_COUNT);

      if (seq !== loadSeq.current) return;
      setMedicines(results);
      setBrowsePage(1);
      setHasMore(filter === '전체');
    } catch (err) {
      if (seq !== loadSeq.current) return;
      const message =
        err instanceof EmergencyApiError ? err.message : '의약품 목록을 불러오지 못했습니다.';
      setError(message);
      setMedicines([]);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (text: string) => {
    const q = text.trim();
    if (q.length < 2) return;

    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    setMedicines([]);

    try {
      const results = await searchMedicinesByName(q);
      if (seq !== loadSeq.current) return;
      setMedicines(results);
      setHasMore(false);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      const message =
        err instanceof EmergencyApiError ? err.message : '약물 정보를 불러오지 못했습니다.';
      setError(message);
      setMedicines([]);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSearchMode) return undefined;
    void loadBrowseData(choseong);
    return undefined;
  }, [isSearchMode, choseong, loadBrowseData]);

  useEffect(() => {
    if (!isSearchMode || trimmedQuery.length < 2) return undefined;
    const timer = setTimeout(() => {
      void runSearch(trimmedQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [trimmedQuery, isSearchMode, runSearch]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2 && choseong !== '전체') {
      setChoseong('전체');
    }
  };

  const handleChoseongChange = (filter: MedicineChoseongFilter) => {
    if (filter === choseong) return;
    loadSeq.current += 1;
    setChoseong(filter);
    if (!isSearchMode) {
      setMedicines([]);
      setLoading(true);
      setError(null);
    }
  };

  const handleLoadMore = async () => {
    if (!isBrowseMode || loadingMore || !hasMore || choseong !== '전체') return;

    setLoadingMore(true);
    try {
      const nextPage = browsePage + 1;
      const batch = await loadMoreMedicines(nextPage);
      if (batch.length === 0) {
        setHasMore(false);
        return;
      }
      setMedicines((prev) => {
        const seen = new Set(prev.map((item) => item.itemSeq || item.itemName));
        const merged = [...prev];
        for (const item of batch) {
          const key = item.itemSeq || item.itemName;
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push(item);
        }
        return merged;
      });
      setBrowsePage(nextPage);
      if (batch.length < BROWSE_PAGE_SIZE) setHasMore(false);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  if (selected) {
    return <MedicineDetail medicine={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1">
      <View className="border-b border-slate-100 bg-white px-4 pb-3 pt-3">
        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          placeholder="제품명 검색 (예: 타이레놀, 게보린)"
          loading={loading && isSearchMode}
        />
        <ChoseongFilterPanel value={choseong} onChange={handleChoseongChange} />
        {error ? (
          <View className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
            <Pressable
              className="mt-2 self-start rounded-lg bg-red-600 px-3 py-1.5"
              onPress={() =>
                isSearchMode ? void runSearch(trimmedQuery) : void loadBrowseData(choseong)
              }
            >
              <Text className="text-xs font-semibold text-white">다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <Text className="mt-2 text-xs text-slate-400">
            {isSearchMode
              ? `'${trimmedQuery}' 검색 · ${filteredData.length}건`
              : choseong === '전체'
                ? `기본 의약품 ${filteredData.length}건 · 아래로 더 불러오기`
                : `초성 '${choseong}' · ${filteredData.length}건`}
          </Text>
        )}
      </View>

      {loading && medicines.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-sm text-slate-500">의약품 정보를 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          key={`drug-list-${choseong}-${isSearchMode ? trimmedQuery : 'browse'}`}
          data={filteredData}
          extraData={{ choseong, query: trimmedQuery, count: filteredData.length }}
          keyExtractor={(item, index) =>
            `${item.itemSeq?.trim() || 'no-seq'}::${item.itemName?.trim() || 'no-name'}::${index}`
          }
          contentContainerClassName="px-4 pb-8 pt-3 gap-3"
          onEndReached={() => void handleLoadMore()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#64748b" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                message={
                  isSearchMode
                    ? '검색 결과가 없습니다'
                    : choseong === '전체'
                      ? '표시할 의약품이 없습니다'
                      : `'${choseong}' 초성 의약품이 없습니다`
                }
                hint={
                  isSearchMode
                    ? '다른 제품명으로 검색하거나 초성 필터를 변경해 보세요'
                    : '전체 버튼을 눌러 기본 목록으로 돌아가 보세요'
                }
              />
            ) : null
          }
          renderItem={({ item }) => (
            <MedicineCard item={item} onPress={() => setSelected(item)} />
          )}
        />
      )}
    </View>
  );
}

function MedicineCard({ item, onPress }: { item: MedicineInfo; onPress: () => void }) {
  const summary = stripHtml(item.efficacy) || '효능 정보를 확인하려면 탭하세요';

  return (
    <Pressable
      className="flex-row rounded-2xl border border-slate-200 bg-white p-3 active:bg-slate-50"
      onPress={onPress}
    >
      <MedicineImage uri={item.itemImage} size={80} />
      <View className="ml-3 flex-1">
        <Text className="text-xs font-medium text-blue-600">{item.entpName || 'e약은요'}</Text>
        <Text className="mt-1 text-base font-bold text-slate-900" numberOfLines={2}>
          {item.itemName?.trim() || '제품명 없음'}
        </Text>
        <Text className="mt-1.5 text-sm leading-5 text-slate-600" numberOfLines={2}>
          {summary}
        </Text>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="document-text-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-xs text-slate-500">상세 · 복용법 · 주의사항</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
        </View>
      </View>
    </Pressable>
  );
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function MedicineDetail({ medicine, onBack }: { medicine: MedicineInfo; onBack: () => void }) {
  useHardwareBackHandler(onBack, true);

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
      <BackHeader title={medicine.itemName} onBack={onBack} />

      <View className="mb-4 flex-row rounded-2xl border border-slate-200 bg-white p-4">
        <MedicineImage uri={medicine.itemImage} size={96} />
        <View className="ml-4 flex-1 justify-center">
          <Text className="text-xs font-medium text-blue-600">{medicine.entpName || 'e약은요'}</Text>
          <Text className="mt-1 text-lg font-bold text-slate-900">{medicine.itemName}</Text>
          <Text className="mt-1 text-xs text-slate-400">품목코드: {medicine.itemSeq || '-'}</Text>
        </View>
      </View>

      <MedicineSection title="효능·효과" body={medicine.efficacy} />
      <MedicineSection title="복용법" body={medicine.usage} />
      <MedicineSection title="사용 전 주의" body={medicine.warningBeforeUse} highlight="amber" />
      <MedicineSection title="주의사항" body={medicine.precautions} highlight="amber" />
      <MedicineSection title="약물 상호작용" body={medicine.interactions} />
      <MedicineSection title="부작용" body={medicine.sideEffects} highlight="red" />
      <MedicineSection title="보관법" body={medicine.storage} />
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
        : 'border-slate-200 bg-white';

  const titleClass =
    highlight === 'red' ? 'text-red-700' : highlight === 'amber' ? 'text-amber-800' : 'text-slate-500';

  const bodyClass =
    highlight === 'red' ? 'text-red-900' : highlight === 'amber' ? 'text-amber-900' : 'text-slate-700';

  return (
    <View className={`mb-4 rounded-2xl border p-4 ${borderClass}`}>
      <Text className={`mb-2 text-sm font-bold uppercase tracking-wide ${titleClass}`}>{title}</Text>
      <Text className={`text-sm leading-6 ${bodyClass}`}>{text}</Text>
    </View>
  );
}
