import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Alert, FlatList, Linking, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import {
  formatAmbulancePhone,
  getAmbulanceSigunguOptionsForSido,
  getAmbulanceSidoOptions,
  listNearbyPrivateAmbulances,
  phoneDialUri,
  searchPrivateAmbulances,
} from '@/services/privateAmbulanceService';
import {
  getLocationWithRegionImmediate,
  subscribeToLocationUpdates,
  type LocationSnapshot,
} from '@/services/locationService';
import type { PrivateAmbulanceListItem } from '@/types/privateAmbulance';

type RegionForm = { sido: string; sigungu: string };
type PickerTarget = 'departureSido' | 'departureSigungu' | null;

const EMPTY_REGION: RegionForm = { sido: '', sigungu: '' };

function RegionPickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="max-h-[60%] rounded-t-3xl bg-kemix-surface" onPress={(e) => e.stopPropagation()}>
          <View className="border-b border-kemix-border-light px-4 py-3">
            <Text className="text-base font-bold text-kemix-text">{title}</Text>
          </View>
          <ScrollView className="max-h-80">
            {options.map((option) => {
              const active = selected === option;
              return (
                <Pressable
                  key={option}
                  className={`border-b border-slate-50 px-4 py-3.5 ${active ? 'bg-sky-50' : ''}`}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                >
                  <Text className={`text-sm ${active ? 'font-bold text-sky-800' : 'text-kemix-text'}`}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RegionSelectRow({
  label,
  sido,
  sigungu,
  onPressSido,
  onPressSigungu,
}: {
  label: string;
  sido: string;
  sigungu: string;
  onPressSido: () => void;
  onPressSigungu: () => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-2 text-sm font-bold text-kemix-text">{label}</Text>
      <View className="flex-row gap-2">
        <Pressable
          className="flex-1 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-bg px-3 py-3"
          onPress={onPressSido}
        >
          <Text className={`text-sm ${sido ? 'text-kemix-text' : 'text-kemix-muted'}`}>
            {sido || '시·도 선택'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" />
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-bg px-3 py-3"
          onPress={onPressSigungu}
        >
          <Text className={`text-sm ${sigungu ? 'text-kemix-text' : 'text-kemix-muted'}`}>
            {sigungu || '시·군·구 선택'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" />
        </Pressable>
      </View>
    </View>
  );
}

function AmbulanceCard({
  item,
  onCall,
}: {
  item: PrivateAmbulanceListItem;
  onCall: (item: PrivateAmbulanceListItem) => void;
}) {
  const phoneLabel = item.p ? formatAmbulancePhone(item.p) : '대표전화 미등록';

  return (
    <View className="mb-3 rounded-2xl border border-kemix-border bg-kemix-surface p-4">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-bold text-kemix-text">{item.n}</Text>
          <Text className="mt-1 text-sm font-semibold text-sky-800">{phoneLabel}</Text>
          {item.t ? <Text className="mt-0.5 text-xs text-kemix-text-secondary">{item.t}</Text> : null}
          <Text className="mt-1 text-xs text-kemix-text-secondary">{item.r}</Text>
          {item.distanceM != null ? (
            <Text className="mt-1 text-xs text-kemix-muted">
              약 {(item.distanceM / 1000).toFixed(1)}km
            </Text>
          ) : null}
        </View>
        <Pressable
          className={`flex-row items-center rounded-xl px-3 py-2.5 ${item.p ? 'bg-sky-700' : 'bg-slate-300'}`}
          onPress={() => onCall(item)}
          disabled={!item.p}
        >
          <Ionicons name="call" size={16} color="#fff" />
          <Text className="ml-1 text-sm font-bold text-white">전화하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function V2CallComingSoonSection() {
  return (
    <View className="mt-2 rounded-2xl border border-dashed border-kemix-border bg-kemix-elevated/80 p-4">
      <View className="flex-row items-center">
        <Ionicons name="construct-outline" size={18} color="#64748b" />
        <Text className="ml-2 text-sm font-bold text-kemix-text">빠른 호출 (v2 예정)</Text>
      </View>
      <Text className="mt-2 text-sm leading-6 text-kemix-text-secondary">
        빠른 호출 기능은 업데이트 준비 중입니다. 현재는 아래 지역별 업체 검색 및 전화 연결을
        이용해 주세요.
      </Text>
      <TextInput
        className="mt-3 min-h-[64px] rounded-xl border border-kemix-border bg-kemix-surface px-3 py-2 text-sm text-kemix-muted"
        placeholder="v2: GPS 기반 즉시 호출 (준비 중)"
        editable={false}
        multiline
      />
      <Pressable className="mt-3 items-center rounded-xl bg-slate-300 py-3.5" disabled>
        <Text className="font-bold text-kemix-text-secondary">사설 구급차 즉시 호출 (준비 중)</Text>
      </Pressable>
    </View>
  );
}

export function PrivateEmsCallScreen() {
  const fabBottomInset = useGlobalFabBottomInset();
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot>(() =>
    getLocationWithRegionImmediate(),
  );
  const [departure, setDeparture] = useState<RegionForm>(EMPTY_REGION);
  const [results, setResults] = useState<PrivateAmbulanceListItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [picker, setPicker] = useState<PickerTarget>(null);

  const reloadNearby = useCallback((snapshot: LocationSnapshot) => {
    const items = listNearbyPrivateAmbulances(snapshot.coordinate, {
      stage1: snapshot.region.stage1,
      stage2: snapshot.region.stage2,
    });
    setResults(items);
    setSearched(false);
  }, []);

  useEffect(() => {
    reloadNearby(locationSnapshot);
    return subscribeToLocationUpdates((snapshot) => {
      setLocationSnapshot(snapshot);
      setDeparture({ sido: snapshot.region.stage1, sigungu: snapshot.region.stage2 });
      reloadNearby(snapshot);
    });
  }, [reloadNearby]);

  useEffect(() => {
    if (!departure.sido && locationSnapshot.region.stage1) {
      setDeparture({
        sido: locationSnapshot.region.stage1,
        sigungu: locationSnapshot.region.stage2,
      });
    }
  }, [locationSnapshot.region.stage1, locationSnapshot.region.stage2, departure.sido]);

  const pickerConfig = useMemo(() => {
    switch (picker) {
      case 'departureSido':
        return {
          title: '출발지 · 시·도',
          options: [...getAmbulanceSidoOptions()],
          selected: departure.sido,
          onSelect: (value: string) => setDeparture({ sido: value, sigungu: '' }),
        };
      case 'departureSigungu':
        return {
          title: '출발지 · 시·군·구',
          options: getAmbulanceSigunguOptionsForSido(departure.sido),
          selected: departure.sigungu,
          onSelect: (value: string) => setDeparture((prev) => ({ ...prev, sigungu: value })),
        };
      default:
        return null;
    }
  }, [picker, departure]);

  const handleSearch = () => {
    if (!departure.sido.trim()) {
      Alert.alert('출발지 선택', '시·도를 선택해 주세요.');
      return;
    }

    const items = searchPrivateAmbulances(departure, locationSnapshot.coordinate);
    setResults(items);
    setSearched(true);

    if (items.length === 0) {
      Alert.alert(
        '검색 결과 없음',
        '선택한 출발지를 커버하는 업체가 없습니다. 시·군·구를 바꾸거나 내 위치 기준으로 다시 확인해 주세요.',
      );
    }
  };

  const handleCall = (item: PrivateAmbulanceListItem) => {
    const dialUri = phoneDialUri(item.p);
    if (!dialUri) {
      Alert.alert('전화 연결 불가', '등록된 대표전화번호가 없습니다.');
      return;
    }

    void Linking.openURL(dialUri).catch(() => {
      Alert.alert('연결 실패', '전화 앱을 열 수 없습니다. 번호를 직접 입력해 주세요.');
    });
  };

  return (
    <View className="flex-1 bg-kemix-bg">
      <FlatList
        data={results}
        keyExtractor={(item) => item.i}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: fabBottomInset }}
        ListHeaderComponent={
          <View className="mb-4 gap-4">
            <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={20} color="#dc2626" />
                <Text className="ml-2 text-sm font-bold text-red-800">응급 상황 안내</Text>
              </View>
              <Text className="mt-2 text-sm leading-5 text-red-700">
                생명이 위험한 응급 상황이라면 119에 먼저 신고하세요. 민간 구급차는 비응급 이송 및
                전원 상담 목적으로 이용됩니다.
              </Text>
            </View>

            <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
              <Text className="text-base font-bold text-kemix-text">출발지 기준 업체 검색</Text>
              <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">
                출발지(시·도·시군구)를 선택하면 해당 지역 및 인접 지역 업체를 우선 보여줍니다.
              </Text>

              <View className="mt-4">
                <RegionSelectRow
                  label="출발지"
                  sido={departure.sido}
                  sigungu={departure.sigungu}
                  onPressSido={() => setPicker('departureSido')}
                  onPressSigungu={() => setPicker('departureSigungu')}
                />
              </View>

              <Pressable
                className="items-center rounded-xl bg-sky-700 py-3.5 active:bg-sky-800"
                onPress={handleSearch}
              >
                <Text className="font-bold text-white">업체 검색</Text>
              </Pressable>

              <Pressable
                className="mt-2 items-center rounded-xl border border-kemix-border py-3 active:bg-kemix-bg"
                onPress={() => reloadNearby(locationSnapshot)}
              >
                <Text className="font-semibold text-kemix-text-secondary">내 위치 기준 다시 보기</Text>
              </Pressable>
            </View>

            <Text className="text-sm font-bold text-kemix-text">
              {searched ? '검색 결과' : '내 위치 인근 업체'} ({results.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-14">
            <Ionicons name="car-outline" size={36} color="#cbd5e1" />
            <Text className="mt-3 text-sm text-kemix-text-secondary">표시할 업체가 없습니다</Text>
          </View>
        }
        renderItem={({ item }) => <AmbulanceCard item={item} onCall={handleCall} />}
        ListFooterComponent={<V2CallComingSoonSection />}
      />

      {pickerConfig ? (
        <RegionPickerModal
          visible={picker !== null}
          title={pickerConfig.title}
          options={pickerConfig.options}
          selected={pickerConfig.selected}
          onSelect={pickerConfig.onSelect}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </View>
  );
}

export { PendingApprovalScreen } from '@/screens/PrivateEmsPendingScreen';
