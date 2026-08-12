import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import { TerminologyCategoryBar } from '@/components/terminology/TerminologyCategoryBar';
import { TerminologyListCard } from '@/components/terminology/TerminologyListCard';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import {
  getMedicalTerminologyCategoryCount,
  getMedicalTerminologyCount,
  searchMedicalTerminology,
} from '@/services/medicalTerminologyStore';
import type { TerminologyCategoryFilter } from '@/types/medicalTerminology';

export function MedicalTerminologyScreen() {
  const fabBottomInset = useGlobalFabBottomInset();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TerminologyCategoryFilter>('전체');
  const deferredQuery = useDeferredValue(query);

  const totalCount = useMemo(() => getMedicalTerminologyCount(), []);
  const trimmedQuery = deferredQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const results = useMemo(
    () => searchMedicalTerminology(trimmedQuery, category),
    [trimmedQuery, category],
  );

  const categoryCount = useMemo(
    () => getMedicalTerminologyCategoryCount(category),
    [category],
  );

  return (
    <ThemedScreen>
      <View className="flex-1">
        <View className="border-b border-kemix-border-light bg-kemix-surface px-4 pb-3 pt-2">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="한글 뜻 또는 영문 용어 검색"
          />
          <TerminologyCategoryBar value={category} onChange={setCategory} />

          <View className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <Text className="text-xs font-semibold text-emerald-900">
              오프라인 내장 KMLE 용어 {totalCount.toLocaleString('ko-KR')}건 · 즉시 검색
            </Text>
            <Text className="mt-0.5 text-[11px] text-emerald-800">
              한글·영문 동시 검색 · 초성·알파벳 카테고리 필터 지원
            </Text>
          </View>

          <Text className="mt-2 text-xs text-kemix-muted">
            {isSearching
              ? `'${trimmedQuery}' 검색 · ${results.length}건`
              : category === '전체'
                ? `전체 ${categoryCount.toLocaleString('ko-KR')}건 · 검색어 또는 카테고리 선택`
                : `카테고리 '${category}' · ${results.length.toLocaleString('ko-KR')}건`}
          </Text>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.category}-${item.korean}-${item.english}-${index}`}
          contentContainerClassName="gap-3 px-4 pt-3"
          contentContainerStyle={{ paddingBottom: fabBottomInset }}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={16}
          maxToRenderPerBatch={24}
          windowSize={8}
          removeClippedSubviews
          ListEmptyComponent={
            <EmptyState
              message={isSearching ? '검색 결과가 없습니다' : '표시할 용어가 없습니다'}
              hint={
                isSearching
                  ? '다른 검색어를 입력하거나 카테고리를 변경해 보세요'
                  : '초성·알파벳 탭을 선택하거나 검색어를 입력해 보세요'
              }
            />
          }
          renderItem={({ item }) => <TerminologyListCard term={item} />}
        />
      </View>
    </ThemedScreen>
  );
}
