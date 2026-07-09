import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BedAvailabilityBar, ErDashboardSummary } from '@/components/ErDashboard';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { SegmentControl } from '@/components/SegmentControl';
import {
  AED_LOCATIONS,
  EMERGENCY_ROOMS,
  ER_STATUS_COLORS,
  ER_STATUS_LABELS,
  MOCK_USER_LOCATION,
  searchAedLocations,
  searchEmergencyRooms,
  type AedLocation,
  type EmergencyRoom,
} from '@/mockData/aedAndEmergency';
import { mockSearchWithQuery } from '@/services/mockSearch';

type MapTab = 'aed' | 'er';

export function MapScreen() {
  const [tab, setTab] = useState<MapTab>('aed');

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="mb-1 text-xl font-bold text-slate-900">AED · 응급실 현황</Text>
        <View className="mb-3 flex-row items-center">
          <Ionicons name="location" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-500">{MOCK_USER_LOCATION.label}</Text>
        </View>
        <SegmentControl
          options={[
            { value: 'aed', label: 'AED 위치' },
            { value: 'er', label: '응급실 현황' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </SafeAreaView>
      {tab === 'aed' ? <AedModule /> : <ErModule />}
    </View>
  );
}

function AedModule() {
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<AedLocation[]>(
    [...AED_LOCATIONS].sort((a, b) => a.distanceM - b.distanceM),
  );
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AedLocation | null>(null);

  const runSearch = useCallback(async (text: string) => {
    setLoading(true);
    const results = await mockSearchWithQuery(searchAedLocations, text);
    setLocations(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  if (selected) {
    return <AedDetail location={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="장소명, 주소 검색 (예: 서울역)"
          loading={loading}
        />
        <Text className="mt-2 text-xs text-slate-400">거리순 정렬 · 가상 GPS 기준</Text>
      </View>
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4 gap-3"
        ListEmptyComponent={
          <EmptyState message="주변 AED를 찾을 수 없습니다" hint="다른 키워드로 검색해 보세요" />
        }
        renderItem={({ item, index }) => (
          <Pressable
            className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
            onPress={() => setSelected(item)}
          >
            <View className="flex-row items-start">
              <View className="mr-3 items-center">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    index === 0 ? 'bg-red-100' : 'bg-slate-100'
                  }`}
                >
                  <Ionicons
                    name="heart-circle"
                    size={24}
                    color={index === 0 ? '#dc2626' : '#64748b'}
                  />
                </View>
                {index === 0 ? (
                  <Text className="mt-1 text-[10px] font-bold text-red-600">최단</Text>
                ) : null}
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">{item.name}</Text>
                <Text className="mt-1 text-sm text-slate-500">{item.address}</Text>
                <View className="mt-3 flex-row items-center gap-4">
                  <View className="flex-row items-center">
                    <Ionicons name="walk-outline" size={14} color="#64748b" />
                    <Text className="ml-1 text-sm font-semibold text-slate-700">
                      {item.distanceM}m · {item.walkMin}분
                    </Text>
                  </View>
                  <AvailabilityBadge available={item.available} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function AedDetail({ location, onBack }: { location: AedLocation; onBack: () => void }) {
  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
      <Pressable className="mb-4 flex-row items-center" onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#0f172a" />
        <Text className="ml-2 text-base font-semibold text-slate-900">목록으로</Text>
      </Pressable>

      <View className="rounded-2xl border border-slate-200 bg-white p-4">
        <View className="mb-4 h-40 items-center justify-center rounded-xl bg-slate-100">
          <Ionicons name="map" size={48} color="#94a3b8" />
          <Text className="mt-2 text-xs text-slate-500">지도 뷰 (mock · 추후 연동)</Text>
          <Text className="text-xs text-slate-400">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </Text>
        </View>

        <Text className="text-xl font-bold text-slate-900">{location.name}</Text>
        <Text className="mt-2 text-sm text-slate-600">{location.address}</Text>

        <View className="mt-4 flex-row gap-3">
          <InfoTile icon="navigate" label="거리" value={`${location.distanceM}m`} />
          <InfoTile icon="walk" label="도보" value={`${location.walkMin}분`} />
          <InfoTile
            icon="checkmark-circle"
            label="상태"
            value={location.available ? '사용 가능' : '점검 중'}
            valueColor={location.available ? '#22c55e' : '#f97316'}
          />
        </View>

        <Text className="mt-4 text-xs text-slate-400">최종 점검: {location.lastChecked}</Text>
      </View>

      <Pressable className="mt-4 flex-row items-center justify-center rounded-xl bg-red-600 py-4">
        <Ionicons name="navigate" size={20} color="#fff" />
        <Text className="ml-2 text-base font-bold text-white">길찾기 (mock)</Text>
      </Pressable>
    </ScrollView>
  );
}

function ErModule() {
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState<EmergencyRoom[]>(
    [...EMERGENCY_ROOMS].sort((a, b) => a.distanceKm - b.distanceKm),
  );
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (text: string) => {
    setLoading(true);
    const results = await mockSearchWithQuery(searchEmergencyRooms, text);
    setRooms(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  const stats = useMemo(() => {
    const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0);
    const totalAvailable = rooms.reduce((s, r) => s + r.availableBeds, 0);
    return {
      totalBeds,
      totalAvailable,
      availableCount: rooms.filter((r) => r.status === 'available').length,
      congestedCount: rooms.filter((r) => r.status === 'congested').length,
      fullCount: rooms.filter((r) => r.status === 'full').length,
    };
  }, [rooms]);

  return (
    <FlatList
      data={rooms}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-4 pb-8 gap-3"
      ListHeaderComponent={
        <View className="mb-2 gap-3">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="병원명, 전문 분야 검색"
            loading={loading}
          />
          <ErDashboardSummary
            totalHospitals={rooms.length}
            totalAvailableBeds={stats.totalAvailable}
            totalBeds={stats.totalBeds}
            availableCount={stats.availableCount}
            congestedCount={stats.congestedCount}
            fullCount={stats.fullCount}
          />
        </View>
      }
      ListEmptyComponent={
        <EmptyState message="응급실 정보가 없습니다" hint="병원명으로 검색해 보세요" />
      }
      renderItem={({ item }) => <ErCard room={item} />}
    />
  );
}

function ErCard({ room }: { room: EmergencyRoom }) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900">{room.hospitalName}</Text>
          <Text className="mt-0.5 text-sm text-slate-500">{room.department}</Text>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${ER_STATUS_COLORS[room.status]}18` }}
        >
          <Text className="text-xs font-bold" style={{ color: ER_STATUS_COLORS[room.status] }}>
            {ER_STATUS_LABELS[room.status]}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <BedAvailabilityBar available={room.availableBeds} total={room.totalBeds} />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {room.specialties.map((s) => (
          <View key={s} className="rounded-full bg-slate-100 px-2.5 py-1">
            <Text className="text-xs text-slate-600">{s}</Text>
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">{room.distanceKm}km</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">대기 ~{room.waitMin}분</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">{room.phone}</Text>
        </View>
      </View>
    </View>
  );
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <View
      className="rounded-full px-2 py-0.5"
      style={{ backgroundColor: available ? '#dcfce7' : '#ffedd5' }}
    >
      <Text
        className="text-xs font-semibold"
        style={{ color: available ? '#16a34a' : '#ea580c' }}
      >
        {available ? '사용 가능' : '점검 중'}
      </Text>
    </View>
  );
}

function InfoTile({
  icon,
  label,
  value,
  valueColor = '#0f172a',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-1 rounded-xl bg-slate-50 p-3">
      <Ionicons name={icon} size={18} color="#64748b" />
      <Text className="mt-1 text-xs text-slate-500">{label}</Text>
      <Text className="text-sm font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
    </View>
  );
}
