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
import { IsolationDistanceChart } from '@/components/IsolationDistanceChart';
import { SearchBar } from '@/components/SearchBar';
import { SegmentControl } from '@/components/SegmentControl';
import { DRUGS, searchDrugs, type Drug } from '@/mockData/drugs';
import {
  HAZARD_LEVEL_COLORS,
  HAZARD_LEVEL_LABELS,
  HAZARDOUS_MATERIALS,
  searchHazardousMaterials,
  type HazardousMaterial,
} from '@/mockData/hazardousMaterials';
import { mockSearchWithQuery } from '@/services/mockSearch';

type ChemicalTab = 'drug' | 'hazard';

export function ChemicalScreen() {
  const [tab, setTab] = useState<ChemicalTab>('drug');

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="mb-1 text-xl font-bold text-slate-900">약물 · 유해화학물질</Text>
        <Text className="mb-3 text-sm text-slate-500">성분명 / UN 번호 검색 (mockData)</Text>
        <SegmentControl
          options={[
            { value: 'drug', label: '약물 정보' },
            { value: 'hazard', label: '유해화학물질' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </SafeAreaView>
      {tab === 'drug' ? <DrugModule /> : <HazardModule />}
    </View>
  );
}

function DrugModule() {
  const [query, setQuery] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>(DRUGS);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Drug | null>(null);

  const runSearch = useCallback(async (text: string) => {
    setLoading(true);
    const results = await mockSearchWithQuery(searchDrugs, text);
    setDrugs(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  if (selected) {
    return <DrugDetail drug={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="성분명, 제품명 검색 (예: 에피네프린)"
          loading={loading}
        />
      </View>
      <FlatList
        data={drugs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4 gap-3"
        ListEmptyComponent={
          <EmptyState message="검색 결과가 없습니다" hint="에피네프린, 날록손 등으로 검색해 보세요" />
        }
        renderItem={({ item }) => (
          <Pressable
            className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
            onPress={() => setSelected(item)}
          >
            <Text className="text-xs font-medium text-blue-600">{item.category}</Text>
            <Text className="mt-1 text-lg font-bold text-slate-900">{item.productName}</Text>
            <Text className="mt-0.5 text-sm text-slate-500">성분: {item.ingredient}</Text>
            <Text className="mt-2 text-sm text-slate-600" numberOfLines={2}>
              {item.indication}
            </Text>
            <View className="mt-3 flex-row items-center">
              <Ionicons name="document-text-outline" size={14} color="#64748b" />
              <Text className="ml-1 text-xs text-slate-500">현장 처치 프로토콜 보기</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function DrugDetail({ drug, onBack }: { drug: Drug; onBack: () => void }) {
  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
      <BackHeader title={drug.productName} onBack={onBack} />

      <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-xs font-medium text-blue-600">{drug.category}</Text>
        <Text className="mt-2 text-sm text-slate-600">{drug.indication}</Text>
        <View className="mt-4 border-t border-slate-100 pt-4">
          <DoseRow label="성인 용량" value={drug.adultDose} />
          <DoseRow label="소아 용량" value={drug.pediatricDose} />
        </View>
      </View>

      <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        현장 처치 프로토콜
      </Text>
      {drug.fieldProtocol.map((step) => (
        <View
          key={step.order}
          className="mb-3 flex-row rounded-2xl border border-slate-200 bg-white p-4"
        >
          <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-600">
            <Text className="text-sm font-bold text-white">{step.order}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900">{step.action}</Text>
            <Text className="mt-1 text-sm leading-5 text-slate-600">{step.detail}</Text>
          </View>
        </View>
      ))}

      <View className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Text className="mb-2 text-sm font-bold text-amber-800">금기 / 주의</Text>
        {drug.contraindications.map((c) => (
          <Text key={c} className="text-sm text-amber-900">
            · {c}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function DoseRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2">
      <Text className="text-xs font-medium text-slate-500">{label}</Text>
      <Text className="text-sm font-semibold text-slate-800">{value}</Text>
    </View>
  );
}

function HazardModule() {
  const [query, setQuery] = useState('');
  const [materials, setMaterials] = useState<HazardousMaterial[]>(HAZARDOUS_MATERIALS);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<HazardousMaterial | null>(null);

  const runSearch = useCallback(async (text: string) => {
    setLoading(true);
    const results = await mockSearchWithQuery(searchHazardousMaterials, text);
    setMaterials(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  if (selected) {
    return <HazardDetail material={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="UN 번호 또는 물질명 (예: UN 1005, 암모니아)"
          loading={loading}
        />
      </View>
      {loading && materials.length === 0 ? (
        <ActivityIndicator className="mt-8" size="large" color="#0f172a" />
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-4 gap-3"
          ListEmptyComponent={
            <EmptyState message="검색 결과가 없습니다" hint="UN 1005, 염소, 황산 등으로 검색해 보세요" />
          }
          renderItem={({ item }) => (
            <Pressable
              className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
              onPress={() => setSelected(item)}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-orange-600">{item.unNumber}</Text>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${HAZARD_LEVEL_COLORS[item.hazardLevel]}20` }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: HAZARD_LEVEL_COLORS[item.hazardLevel] }}
                  >
                    위험 {HAZARD_LEVEL_LABELS[item.hazardLevel]}
                  </Text>
                </View>
              </View>
              <Text className="mt-2 text-lg font-bold text-slate-900">{item.name}</Text>
              <Text className="text-sm text-slate-500">{item.nameEn}</Text>
              <Text className="mt-2 text-sm text-slate-600">{item.hazardClass} · {item.ergGuide}</Text>
              <View className="mt-3 flex-row items-center">
                <Ionicons name="resize-outline" size={14} color="#64748b" />
                <Text className="ml-1 text-xs text-slate-500">이격 거리 시각화 보기</Text>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function HazardDetail({ material, onBack }: { material: HazardousMaterial; onBack: () => void }) {
  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
      <BackHeader title={material.name} onBack={onBack} />

      <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <View className="flex-row flex-wrap gap-2">
          <Badge label={material.unNumber} color="#ea580c" />
          <Badge label={material.ergGuide} color="#64748b" />
          <Badge
            label={`위험 ${HAZARD_LEVEL_LABELS[material.hazardLevel]}`}
            color={HAZARD_LEVEL_COLORS[material.hazardLevel]}
          />
        </View>
        <Text className="mt-3 text-sm text-slate-500">{material.nameEn}</Text>
        <Text className="mt-1 text-base font-semibold text-slate-800">{material.hazardClass}</Text>
      </View>

      <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        초기 이격 거리 (ERG 가상)
      </Text>
      <IsolationDistanceChart zones={material.isolationZones} />

      <Text className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">
        노출 증상
      </Text>
      <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        {material.symptoms.map((s) => (
          <Text key={s} className="mb-1 text-sm text-slate-700">
            · {s}
          </Text>
        ))}
      </View>

      <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        초기 대응
      </Text>
      {material.firstActions.map((action, i) => (
        <View
          key={action}
          className="mb-2 flex-row rounded-xl border border-slate-200 bg-white p-3"
        >
          <Text className="mr-2 font-bold text-orange-600">{i + 1}.</Text>
          <Text className="flex-1 text-sm text-slate-700">{action}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${color}18` }}>
      <Text className="text-xs font-bold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
