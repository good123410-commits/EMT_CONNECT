import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BedAvailabilityBar, ErDashboardSummary } from '@/components/ErDashboard';
import { EmptyState } from '@/components/EmptyState';
import {
  MapMarkerDetailSheet,
  MapMarkerShellCard,
} from '@/components/map/MapMarkerDetailSheet';
import { SearchBar } from '@/components/SearchBar';
import { SegmentControl } from '@/components/SegmentControl';
import { ER_STATUS_COLORS, ER_STATUS_LABELS } from '@/mockData/aedAndEmergency';
import {
  EmergencyApiError,
  fetchAedDetail,
  fetchAedMarkerShells,
  fetchHospitalDetail,
  fetchHospitalMarkerShells,
  fetchPharmacyDetail,
  fetchPharmacyMarkerShells,
  formatCount,
  formatEmergencyUpdatedAt,
  getEquipmentLabels,
  isPediatricPriorityHospital,
  safeDisplayText,
  safeErStatus,
  type AedLocationItem,
  type AedMarkerShell,
  type HospitalDetail,
  type HospitalMarkerShell,
  type PharmacyInfo,
  type PharmacyMarkerShell,
} from '@/services/emergencyApi';
import {
  getLocationWithRegionImmediate,
  subscribeToLocationUpdates,
  type LocationSnapshot,
} from '@/services/locationService';

type MapTab = 'aed' | 'er' | 'pharmacy';

export function MapScreen() {
  const isFocused = useIsFocused();
  const [tab, setTab] = useState<MapTab>('aed');
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot>(() =>
    getLocationWithRegionImmediate(),
  );

  useEffect(() => {
    return subscribeToLocationUpdates(setLocationSnapshot);
  }, []);

  const regionLabel =
    locationSnapshot.permissionGranted
      ? `${locationSnapshot.region.label} · GPS 기준`
      : `${locationSnapshot.region.label} · 기본 위치`;

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="mb-1 text-xl font-bold text-slate-900">AED · 응급실 현황</Text>
        <View className="mb-3 flex-row items-center">
          <Ionicons name="location" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-500">{regionLabel}</Text>
        </View>
        <SegmentControl
          options={[
            { value: 'aed', label: 'AED' },
            { value: 'er', label: '응급실' },
            { value: 'pharmacy', label: '약국' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </SafeAreaView>
      {tab === 'aed' ? (
        <AedModule active={isFocused} />
      ) : tab === 'er' ? (
        <ErModule active={isFocused} />
      ) : (
        <PharmacyModule active={isFocused} />
      )}
    </View>
  );
}

function AedModule({ active }: { active: boolean }) {
  const [query, setQuery] = useState('');
  const [markers, setMarkers] = useState<AedMarkerShell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'gps' | 'region'>('gps');
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<AedMarkerShell | null>(null);
  const [detail, setDetail] = useState<AedLocationItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadMarkerShells = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    const trimmed = searchQuery.trim();

    try {
      const items = trimmed
        ? await fetchAedMarkerShells({ addressQuery: trimmed, maxResults: 80 })
        : await fetchAedMarkerShells({ maxResults: 50 });

      setMarkers(items);
      setSearchMode(trimmed ? 'region' : 'gps');
    } catch (err) {
      const message =
        err instanceof EmergencyApiError ? err.message : 'AED 정보를 불러오지 못했습니다.';
      setError(message);
      setMarkers([]);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => {
      void loadMarkerShells(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [active, query, loadMarkerShells]);

  useEffect(() => {
    if (!active || query.trim()) return undefined;
    return subscribeToLocationUpdates((snapshot) => {
      if (snapshot.permissionGranted) {
        void loadMarkerShells('');
      }
    });
  }, [active, query, loadMarkerShells]);

  const loadDetail = useCallback(async (marker: AedMarkerShell) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const result = await fetchAedDetail(marker.id, {
        addressQuery: query.trim() || undefined,
      });
      setDetail(result);
    } catch (err) {
      const message =
        err instanceof EmergencyApiError ? err.message : 'AED 상세 정보를 불러오지 못했습니다.';
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, [query]);

  const handleMarkerPress = (marker: AedMarkerShell) => {
    setSelectedMarker(marker);
    void loadDetail(marker);
  };

  const handleCloseSheet = () => {
    setSelectedMarker(null);
    setDetail(null);
    setDetailError(null);
  };

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="지역·읍면동·상세주소 검색"
          loading={loading}
        />
        {error ? (
          <View className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
            <Pressable
              className="mt-2 self-start rounded-lg bg-red-600 px-3 py-1.5"
              onPress={() => void loadMarkerShells(query)}
            >
              <Text className="text-xs font-semibold text-white">다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <Text className="mt-2 text-xs text-slate-400">
            {searchMode === 'region'
              ? `'${query.trim()}' 주소 검색 · 마커 고속 로딩 · 탭 시 상세`
              : 'GPS 5km · 마커 고속 로딩 · 탭 시 상세'}
          </Text>
        )}
      </View>

      <FlatList
        data={markers}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4 gap-3"
        ListEmptyComponent={
          loading && !initialLoaded ? null : (
            <EmptyState
              message={query.trim() ? '해당 주소의 AED를 찾을 수 없습니다' : '주변 AED를 찾을 수 없습니다'}
              hint="읍·면·동, 시·군·구, 상세 주소로 검색해 보세요"
            />
          )
        }
        renderItem={({ item, index }) => (
          <MapMarkerShellCard
            name={item.name}
            distanceM={item.distanceM}
            walkMin={item.walkMin}
            icon="heart-circle"
            iconColor={index === 0 && searchMode === 'gps' ? '#dc2626' : '#64748b'}
            badge={index === 0 && searchMode === 'gps' ? '최단' : undefined}
            selected={selectedMarker?.id === item.id}
            onPress={() => handleMarkerPress(item)}
          />
        )}
      />

      <MapMarkerDetailSheet
        visible={selectedMarker !== null}
        title={detail?.buildPlace || detail?.org || selectedMarker?.name || 'AED'}
        loading={detailLoading}
        error={detailError}
        onClose={handleCloseSheet}
        onRetry={selectedMarker ? () => void loadDetail(selectedMarker) : undefined}
      >
        {detail ? <AedDetailContent location={detail} /> : null}
      </MapMarkerDetailSheet>
    </View>
  );
}

function AedDetailContent({ location }: { location: AedLocationItem }) {
  return (
    <View>
      <View className="mb-4 h-32 items-center justify-center rounded-xl bg-slate-100">
        <Ionicons name="map" size={40} color="#94a3b8" />
        <Text className="mt-2 text-xs text-slate-500">AED 설치 위치</Text>
        <Text className="text-xs text-slate-400">
          {Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
            ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
            : '좌표 정보 없음'}
        </Text>
      </View>

      <Text className="text-sm text-slate-600">{location.buildPlace || '-'}</Text>
      <Text className="mt-1 text-sm text-slate-500">{location.buildAddress || '-'}</Text>
      <Text className="mt-1 text-sm text-slate-500">{location.org || '-'}</Text>

      <View className="mt-4 flex-row gap-3">
        <InfoTile icon="navigate" label="거리" value={`${location.distanceM}m`} />
        <InfoTile icon="walk" label="도보" value={`${location.walkMin}분`} />
        <InfoTile
          icon="checkmark-circle"
          label="운영"
          value={location.available24h ? '24시간' : '시간 제한'}
          valueColor={location.available24h ? '#22c55e' : '#f97316'}
        />
      </View>

      <Text className="mt-4 text-xs text-slate-500">
        모델: {location.model || '-'} · 제조사: {location.manufacturer || '-'}
      </Text>
      <Text className="mt-1 text-xs text-slate-500">
        연락처: {location.clerkTel || location.managerTel || '-'}
      </Text>
      <Text className="mt-1 text-xs text-slate-500">
        관리자: {location.managerTel || '-'}
      </Text>
    </View>
  );
}

function PharmacyModule({ active }: { active: boolean }) {
  const [query, setQuery] = useState('');
  const [markers, setMarkers] = useState<PharmacyMarkerShell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<PharmacyMarkerShell | null>(null);
  const [detail, setDetail] = useState<PharmacyInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadMarkerShells = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchPharmacyMarkerShells({ maxResults: 40, holidayKeeper: true });
      setMarkers(items);
    } catch (err) {
      const message =
        err instanceof EmergencyApiError ? err.message : '약국 정보를 불러오지 못했습니다.';
      setError(message);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void loadMarkerShells();
  }, [active, loadMarkerShells]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return markers;
    return markers.filter((p) => p.name.toLowerCase().includes(q));
  }, [markers, query]);

  const loadDetail = useCallback(async (marker: PharmacyMarkerShell) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const result = await fetchPharmacyDetail(marker.hpid, {
        holidayKeeper: true,
        markerCoordinate: { latitude: marker.latitude, longitude: marker.longitude },
      });
      setDetail(result);
    } catch (err) {
      const message =
        err instanceof EmergencyApiError ? err.message : '약국 상세 정보를 불러오지 못했습니다.';
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleMarkerPress = (marker: PharmacyMarkerShell) => {
    setSelectedMarker(marker);
    void loadDetail(marker);
  };

  const handleCloseSheet = () => {
    setSelectedMarker(null);
    setDetail(null);
    setDetailError(null);
  };

  return (
    <View className="flex-1">
      <View className="px-4 py-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="약국명 검색"
          loading={loading}
        />
        {error ? (
          <View className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
            <Pressable
              className="mt-2 self-start rounded-lg bg-red-600 px-3 py-1.5"
              onPress={() => void loadMarkerShells()}
            >
              <Text className="text-xs font-semibold text-white">다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <Text className="mt-2 text-xs text-slate-400">
            마커 고속 로딩 · 탭 시 주소·전화·진료시간 상세 조회
          </Text>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.hpid}
        contentContainerClassName="px-4 pb-4 gap-3"
        ListEmptyComponent={
          loading ? null : (
            <EmptyState message="주변 약국을 찾을 수 없습니다" hint="다른 키워드로 검색해 보세요" />
          )
        }
        renderItem={({ item }) => (
          <MapMarkerShellCard
            name={item.name}
            distanceM={item.distanceM}
            walkMin={item.walkMin}
            icon="medical"
            selected={selectedMarker?.hpid === item.hpid}
            onPress={() => handleMarkerPress(item)}
          />
        )}
      />

      <MapMarkerDetailSheet
        visible={selectedMarker !== null}
        title={detail?.name || selectedMarker?.name || '약국'}
        loading={detailLoading}
        error={detailError}
        onClose={handleCloseSheet}
        onRetry={selectedMarker ? () => void loadDetail(selectedMarker) : undefined}
      >
        {detail ? <PharmacyDetailContent pharmacy={detail} /> : null}
      </MapMarkerDetailSheet>
    </View>
  );
}

function PharmacyDetailContent({ pharmacy }: { pharmacy: PharmacyInfo }) {
  return (
    <View>
      <Text className="text-sm text-slate-600">{pharmacy.address || '-'}</Text>
      <View className="mt-4 flex-row flex-wrap items-center gap-3">
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: pharmacy.isOpenNow ? '#dcfce7' : '#f1f5f9' }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: pharmacy.isOpenNow ? '#16a34a' : '#64748b' }}
          >
            {pharmacy.isOpenNow ? '운영 중' : '시간 확인'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="walk-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">
            {pharmacy.distanceM}m · {pharmacy.walkMin}분
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">
            {pharmacy.treatmentDayLabel} {pharmacy.dutyTimeStart}~{pharmacy.dutyTimeEnd}
          </Text>
        </View>
        {pharmacy.phone ? (
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={14} color="#64748b" />
            <Text className="ml-1 text-sm text-slate-600">{pharmacy.phone}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ErModule({ active }: { active: boolean }) {
  const [query, setQuery] = useState('');
  const [markers, setMarkers] = useState<HospitalMarkerShell[]>([]);
  const [regionLabel, setRegionLabel] = useState(() => getLocationWithRegionImmediate().region.label);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<HospitalMarkerShell | null>(null);
  const [detail, setDetail] = useState<HospitalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadMarkerShells = useCallback(async (snapshot = getLocationWithRegionImmediate()) => {
    setLoading(true);
    setError(null);
    setRegionLabel(snapshot.region.label);

    try {
      const items = await fetchHospitalMarkerShells({
        coordinate: snapshot.coordinate,
        region: snapshot.region,
        maxResults: 50,
      });
      setMarkers(items);
    } catch (err) {
      const message =
        err instanceof EmergencyApiError
          ? err.message
          : '응급실 정보를 불러오지 못했습니다.';
      setError(message);
      setMarkers([]);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    void loadMarkerShells();
    return subscribeToLocationUpdates((snapshot) => {
      if (snapshot.permissionGranted) {
        void loadMarkerShells(snapshot);
      }
    });
  }, [active, loadMarkerShells]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return markers;
    return markers.filter((item) => item.name.toLowerCase().includes(q));
  }, [markers, query]);

  const stats = useMemo(() => {
    const totalAvailable = filtered.reduce(
      (sum, item) => sum + (Number.isFinite(item.availableErBeds) ? item.availableErBeds : 0),
      0,
    );
    return {
      totalAvailable,
      pediatricCount: filtered.filter((item) => item.isPediatricPriority).length,
      availableCount: filtered.filter((item) => safeErStatus(item.status) === 'available').length,
      congestedCount: filtered.filter((item) => safeErStatus(item.status) === 'congested').length,
      fullCount: filtered.filter((item) => safeErStatus(item.status) === 'full').length,
    };
  }, [filtered]);

  const loadDetail = useCallback(async (marker: HospitalMarkerShell) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const result = await fetchHospitalDetail(marker.hpid);
      setDetail(result);
    } catch (err) {
      const message =
        err instanceof EmergencyApiError
          ? err.message
          : '응급실 상세 정보를 불러오지 못했습니다.';
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleMarkerPress = (marker: HospitalMarkerShell) => {
    setSelectedMarker(marker);
    void loadDetail(marker);
  };

  const handleCloseSheet = () => {
    setSelectedMarker(null);
    setDetail(null);
    setDetailError(null);
  };

  return (
    <View className="flex-1">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.hpid}
        contentContainerClassName="p-4 pb-8 gap-3"
        ListHeaderComponent={
          <View className="mb-2 gap-3">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="병원명 검색"
              loading={loading}
            />
            {error ? (
              <View className="rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-700">{error}</Text>
                <Pressable
                  className="mt-2 self-start rounded-lg bg-red-600 px-3 py-1.5"
                  onPress={() => void loadMarkerShells()}
                >
                  <Text className="text-xs font-semibold text-white">다시 시도</Text>
                </Pressable>
              </View>
            ) : (
              <ErDashboardSummary
                regionLabel={`${regionLabel} · 👶소아우선 ${stats.pediatricCount}곳 · GPS 거리순`}
                totalHospitals={filtered.length}
                totalAvailableBeds={stats.totalAvailable}
                availableCount={stats.availableCount}
                congestedCount={stats.congestedCount}
                fullCount={stats.fullCount}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          loading && !initialLoaded ? null : (
            <EmptyState
              message={error ? '응급실 정보를 불러올 수 없습니다' : '응급실 정보가 없습니다'}
              hint={error ? '네트워크 연결을 확인해 주세요' : '병원명으로 검색해 보세요'}
            />
          )
        }
        renderItem={({ item }) => (
          <ErMarkerCard
            marker={item}
            selected={selectedMarker?.hpid === item.hpid}
            onPress={() => handleMarkerPress(item)}
          />
        )}
      />

      <MapMarkerDetailSheet
        visible={selectedMarker !== null}
        title={detail?.hospitalName || selectedMarker?.name || '응급실'}
        loading={detailLoading}
        error={detailError}
        onClose={handleCloseSheet}
        onRetry={selectedMarker ? () => void loadDetail(selectedMarker) : undefined}
      >
        {detail ? <ErDetailContent room={detail} /> : null}
      </MapMarkerDetailSheet>
    </View>
  );
}

function ErMarkerCard({
  marker,
  selected,
  onPress,
}: {
  marker: HospitalMarkerShell;
  selected: boolean;
  onPress: () => void;
}) {
  const status = safeErStatus(marker.status);
  const availableErBeds = Number.isFinite(marker.availableErBeds) ? marker.availableErBeds : 0;

  return (
    <Pressable
      className={`rounded-2xl border bg-white p-4 ${
        marker.isPediatricPriority
          ? selected
            ? 'border-pink-400 bg-pink-50'
            : 'border-pink-200'
          : selected
            ? 'border-red-300 bg-red-50'
            : 'border-slate-200'
      }`}
      onPress={onPress}
    >
      {marker.isPediatricPriority ? (
        <View className="mb-2 self-start rounded-full bg-pink-100 px-2.5 py-1">
          <Text className="text-xs font-bold text-pink-700">👶 소아 특화</Text>
        </View>
      ) : null}
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 text-base font-bold text-slate-900">{marker.name}</Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${ER_STATUS_COLORS[status]}18` }}
        >
          <Text className="text-xs font-bold" style={{ color: ER_STATUS_COLORS[status] }}>
            {ER_STATUS_LABELS[status]}
          </Text>
        </View>
      </View>
      <View className="mt-3">
        <BedAvailabilityBar available={availableErBeds} status={status} />
      </View>
      <View className="mt-3 flex-row items-center gap-3">
        {marker.distanceM > 0 ? (
          <View className="flex-row items-center">
            <Ionicons name="walk-outline" size={14} color="#64748b" />
            <Text className="ml-1 text-sm text-slate-600">
              {marker.distanceM}m · {marker.walkMin}분
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-slate-400">탭하여 주소·전화·상세 병상 확인</Text>
        )}
        {marker.availablePediatricErBeds > 0 ? (
          <Text className="text-xs font-semibold text-pink-700">
            소아 {marker.availablePediatricErBeds}병상
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ErDetailContent({ room }: { room: HospitalDetail }) {
  const equipment = getEquipmentLabels(room);
  const status = safeErStatus(room.status);
  const availableErBeds = Number.isFinite(room.availableErBeds) ? room.availableErBeds : 0;
  const availablePediatricBeds = Number.isFinite(room.availablePediatricErBeds)
    ? room.availablePediatricErBeds
    : 0;
  const showPediatricTag = isPediatricPriorityHospital(room);

  return (
    <View>
      {showPediatricTag ? (
        <View className="mb-2 self-start rounded-full bg-pink-100 px-2.5 py-1">
          <Text className="text-xs font-bold text-pink-700">
            👶 소아 특화{room.isMoonlightHospital ? '/달빛어린이' : ''}
          </Text>
        </View>
      ) : null}

      <Text className="text-sm text-slate-500">
        {safeDisplayText(room.emergencyClassName, '응급의학과')}
      </Text>
      {room.address ? (
        <Text className="mt-1 text-sm text-slate-600">{safeDisplayText(room.address)}</Text>
      ) : null}
      {room.description ? (
        <Text className="mt-2 text-sm text-slate-500">{room.description}</Text>
      ) : null}
      {room.onCallDoctor ? (
        <Text className="mt-1 text-xs text-slate-400">
          당직의: {safeDisplayText(room.onCallDoctor)}
        </Text>
      ) : null}

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-slate-700">응급실 병상</Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${ER_STATUS_COLORS[status]}18` }}
        >
          <Text className="text-xs font-bold" style={{ color: ER_STATUS_COLORS[status] }}>
            {ER_STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <View className="mt-2">
        <BedAvailabilityBar available={availableErBeds} status={status} />
      </View>

      {availablePediatricBeds > 0 ? (
        <View className="mt-2 rounded-lg bg-pink-50 px-3 py-2">
          <Text className="text-xs font-semibold text-pink-700">
            소아 응급 가용 병상: {formatCount(availablePediatricBeds, '0')}병상
          </Text>
        </View>
      ) : null}

      {equipment.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {equipment.map((label) => (
            <View key={label} className="rounded-full bg-slate-100 px-2.5 py-1">
              <Text className="text-xs text-slate-600">{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-3 flex-row flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">
            {formatCount(room.distanceKm, '-')}km
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="walk-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">
            {formatCount(room.walkMin, '-')}분
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">
            {safeDisplayText(
              room.erPhone && room.erPhone !== '-' ? room.erPhone : room.erDoctorPhone,
              '-',
            )}
          </Text>
        </View>
      </View>
      {room.updatedAt ? (
        <Text className="mt-2 text-xs text-slate-400">
          갱신: {formatEmergencyUpdatedAt(room.updatedAt)}
        </Text>
      ) : null}
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
