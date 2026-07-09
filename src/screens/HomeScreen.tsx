import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
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
import { SearchBar } from '@/components/SearchBar';
import {
  FIRST_AID_GUIDES,
  searchFirstAidGuides,
  type FirstAidGuide,
} from '@/mockData/firstAid';
import { mockSearchWithQuery } from '@/services/mockSearch';

const SEVERITY_COLORS = {
  critical: { bg: '#fef2f2', text: '#dc2626', label: '긴급' },
  urgent: { bg: '#fff7ed', text: '#ea580c', label: '주의' },
  moderate: { bg: '#f0fdf4', text: '#16a34a', label: '일반' },
} as const;

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  heart: 'heart',
  body: 'body',
  fitness: 'fitness',
  flame: 'flame',
  water: 'water',
  pulse: 'pulse',
};

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [guides, setGuides] = useState<FirstAidGuide[]>(FIRST_AID_GUIDES);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FirstAidGuide | null>(null);

  const runSearch = useCallback(async (text: string) => {
    setLoading(true);
    const results = await mockSearchWithQuery(searchFirstAidGuides, text);
    setGuides(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  if (selected) {
    return <GuideDetail guide={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="mb-1 text-xl font-bold text-slate-900">생활 응급처치 가이드</Text>
        <Text className="mb-3 text-sm text-slate-500">상황별 단계별 처치 방법 (mockData)</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="심정지, 기도폐쇄, 골절..."
          loading={loading}
        />
      </SafeAreaView>

      {loading && guides.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={guides}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 gap-3"
          ListEmptyComponent={
            <EmptyState message="검색 결과가 없습니다" hint="다른 키워드로 검색해 보세요" />
          }
          renderItem={({ item }) => (
            <GuideCard guide={item} onPress={() => setSelected(item)} />
          )}
        />
      )}
    </View>
  );
}

function GuideCard({ guide, onPress }: { guide: FirstAidGuide; onPress: () => void }) {
  const severity = SEVERITY_COLORS[guide.severity];
  const iconName = ICON_MAP[guide.icon] ?? 'medkit';

  return (
    <Pressable
      className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
      onPress={onPress}
    >
      <View className="flex-row items-start">
        <View className="mr-3 rounded-xl bg-red-50 p-3">
          <Ionicons name={iconName} size={28} color="#dc2626" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
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
          <Text className="mt-2 text-sm leading-5 text-slate-600">{guide.summary}</Text>
          <View className="mt-3 flex-row items-center">
            <Text className="text-xs font-medium text-slate-400">{guide.steps.length}단계</Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function GuideDetail({ guide, onBack }: { guide: FirstAidGuide; onBack: () => void }) {
  const severity = SEVERITY_COLORS[guide.severity];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-4 pb-8">
      <BackHeader title={guide.title} onBack={onBack} />

      <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <View
          className="mb-2 self-start rounded-full px-3 py-1"
          style={{ backgroundColor: severity.bg }}
        >
          <Text className="text-xs font-bold" style={{ color: severity.text }}>
            {severity.label} 상황
          </Text>
        </View>
        <Text className="text-base leading-6 text-slate-700">{guide.summary}</Text>
      </View>

      <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        처치 단계
      </Text>
      {guide.steps.map((step) => (
        <View
          key={step.order}
          className="mb-3 flex-row rounded-2xl border border-slate-200 bg-white p-4"
        >
          <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-slate-900">
            <Text className="text-sm font-bold text-white">{step.order}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900">{step.title}</Text>
            <Text className="mt-1 text-sm leading-5 text-slate-600">{step.description}</Text>
          </View>
        </View>
      ))}

      {guide.warnings.length > 0 ? (
        <>
          <Text className="mb-3 mt-2 text-sm font-bold uppercase tracking-wide text-red-500">
            주의사항
          </Text>
          <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
            {guide.warnings.map((w) => (
              <View key={w} className="mb-2 flex-row last:mb-0">
                <Ionicons name="warning" size={16} color="#dc2626" style={{ marginTop: 2 }} />
                <Text className="ml-2 flex-1 text-sm text-red-800">{w}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
