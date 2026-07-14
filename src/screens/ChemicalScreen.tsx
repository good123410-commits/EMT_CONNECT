import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
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
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { EmergencyApiError, searchMedicine, type MedicineInfo } from '@/services/emergencyApi';

export function ChemicalScreen() {
  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="mb-1 text-xl font-bold text-slate-900">약물 정보</Text>
        <Text className="text-sm text-slate-500">e약은요 API · 기본 약물 검색</Text>
      </SafeAreaView>
      <DrugModule />
    </View>
  );
}

function DrugModule() {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<MedicineInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MedicineInfo | null>(null);

  const runSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setMedicines([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchMedicine({ itemName: trimmed, numOfRows: 20 });
      setMedicines(results);
    } catch (err) {
      const message =
        err instanceof EmergencyApiError ? err.message : '약물 정보를 불러오지 못했습니다.';
      setError(message);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, runSearch]);

  if (selected) {
    return <MedicineDetail medicine={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="제품명 검색 (예: 타이레놀, 게보린)"
          loading={loading}
        />
        {error ? (
          <View className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
            <Pressable
              className="mt-2 self-start rounded-lg bg-red-600 px-3 py-1.5"
              onPress={() => runSearch(query)}
            >
              <Text className="text-xs font-semibold text-white">다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <Text className="mt-2 text-xs text-slate-400">식약처 e약은요 API · 2글자 이상 입력</Text>
        )}
      </View>
      <FlatList
        data={medicines}
        keyExtractor={(item) => item.itemSeq || item.itemName}
        contentContainerClassName="px-4 pb-4 gap-3"
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              message={query.trim().length < 2 ? '약 이름을 검색해 주세요' : '검색 결과가 없습니다'}
              hint={
                query.trim().length < 2
                  ? '타이레놀, 게보린, 아스피린 등으로 검색'
                  : '다른 제품명으로 검색해 보세요'
              }
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
            onPress={() => setSelected(item)}
          >
            <Text className="text-xs font-medium text-blue-600">{item.entpName || 'e약은요'}</Text>
            <Text className="mt-1 text-lg font-bold text-slate-900">{item.itemName}</Text>
            <Text className="mt-2 text-sm text-slate-600" numberOfLines={2}>
              {stripHtml(item.efficacy) || '효능 정보를 확인하려면 탭하세요'}
            </Text>
            <View className="mt-3 flex-row items-center">
              <Ionicons name="document-text-outline" size={14} color="#64748b" />
              <Text className="ml-1 text-xs text-slate-500">복용법 · 주의사항 보기</Text>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
            </View>
          </Pressable>
        )}
      />
    </View>
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

      <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-xs font-medium text-blue-600">{medicine.entpName}</Text>
        <Text className="mt-1 text-xs text-slate-400">품목코드: {medicine.itemSeq || '-'}</Text>
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
