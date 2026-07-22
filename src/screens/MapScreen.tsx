import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BedAvailabilityBar, ErDashboardSummary } from '@/components/ErDashboard';
import { EmptyState } from '@/components/EmptyState';
import { ErDutyContactButtons, ErHospitalSpecsPanel } from '@/components/facility/ErHospitalSpecsPanel';
import { FacilitySearchBarComponent } from '@/components/facility/FacilitySearchBarComponent';
import { PediatricHospitalCard } from '@/components/facility/PediatricHospitalCard';
import { PartnerHospitalBadge } from '@/components/facility/PartnerHospitalBadge';
import { HospitalSpecialtyTags } from '@/components/facility/HospitalSpecialtyTags';
import { HospitalWeeklyHours } from '@/components/facility/HospitalWeeklyHours';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import { EmergencyMapView } from '@/components/map/EmergencyMapView';
import { DistanceText } from '@/components/map/DistanceText';
import { PharmacyOpenBadge } from '@/components/map/PharmacyOpenBadge';
import { SegmentControl } from '@/components/SegmentControl';
import { useFacilitySearchMode } from '@/hooks/useFacilitySearchMode';
import {
  useFacilityMarkersQuery,
  usePrefetchFacilityMarkers,
} from '@/hooks/useFacilityMarkersQuery';
import { ER_STATUS_COLORS, ER_STATUS_LABELS } from '@/mockData/aedAndEmergency';
import {
  formatCount,
  formatEmergencyUpdatedAt,
  isMoonlightChildrenHospital,
  safeErStatus,
  type HospitalDetail,
} from '@/services/emergencyApi';

import {
  fetchPediatricHospitals,
  fetchRegionalHospitalMetadataIndex,
  type HospitalFinderItem,
  type HospitalMetadataEntry,
} from '@/services/hospitalFinderService';
import {
  ensureCustomHospitalDbHydrated,
  mergeCustomHospitalsIntoPediatricList,
} from '@/services/customHospitalService';
import {
  applyErLiveOverlayToLocal,
  enrichErMarkersWithMetadata,
  fetchErHospitalFullDetail,
  fetchErLiveOverlay,
  getHybridHospitalDetailFromStore,
  resolveErLiveApiRegion,
  sortErTabHospitals,
  type ErLiveOverlayResult,
  type LocalHospitalMarkerWithLive,
} from '@/services/hybridErService';
import {
  getLocationWithRegionImmediate,
  subscribeToLocationUpdates,
  type LocationRegion,
  type LocationSnapshot,
} from '@/services/locationService';
import { LIVE_STATUS_FALLBACK_MESSAGE } from '@/types/localFacility';
import type { LocalPharmacyMarker } from '@/types/localFacility';
import {
  getMapCenterFromSnapshot,
  toAedMapPoints,
  toLocalHospitalMapPoints,
  toLocalPharmacyMapPoints,
  toPediatricHospitalMapPoints,
} from '@/utils/mapMarkers';
import {
  MapMarkerDetailSheet,
  MapMarkerShellCard,
} from '@/components/map/MapMarkerDetailSheet';
import { confirmPhoneCall } from '@/utils/confirmPhoneCall';
import { buildEmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';
import { getHospitalErOverride } from '@/services/customHospitalService';
import { mergeEmergencyBedWithOverride, mergeSpecsWithErOverride } from '@/utils/hospitalEquipmentOverride';
import {
  cycleDistanceUnitMode,
  formatDistanceMeters,
  type DistanceUnitMode,
} from '@/utils/formatDistance';
import { getPharmacyOpenStatus } from '@/utils/pharmacyHours';
import { getTreatmentDayCode } from '@/utils/hospitalHours';

import type { LocalAedMarker } from '@/types/localAed';

type MapModuleSharedProps = {
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitModeChange: (mode: DistanceUnitMode) => void;
};

type MapTab = 'aed' | 'er' | 'pharmacy' | 'pediatric';

export function MapScreen() {
  const isFocused = useIsFocused();
  const [tab, setTab] = useState<MapTab>('aed');
  const [distanceUnitMode, setDistanceUnitMode] = useState<DistanceUnitMode>('auto');
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot>(() =>
    getLocationWithRegionImmediate(),
  );

  const facilitySearch = useFacilitySearchMode({ locationSnapshot });
  usePrefetchFacilityMarkers(facilitySearch.searchParams, isFocused);

  const handleDistanceUnitChange = (mode: DistanceUnitMode) => {
    setDistanceUnitMode(mode);
  };

  const mapModuleShared: MapModuleSharedProps = {
    distanceUnitMode,
    onDistanceUnitModeChange: handleDistanceUnitChange,
  };

  useEffect(() => {
    return subscribeToLocationUpdates(setLocationSnapshot);
  }, []);

  useEffect(() => {
    void ensureCustomHospitalDbHydrated();
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
            { value: 'pediatric', label: '소아' },
            { value: 'pharmacy', label: '약국' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </SafeAreaView>
      <View style={{ flex: 1, display: tab === 'aed' ? 'flex' : 'none' }}>
        <AedModule
          locationSnapshot={locationSnapshot}
          facilitySearch={facilitySearch}
          {...mapModuleShared}
        />
      </View>
      <View style={{ flex: 1, display: tab === 'er' ? 'flex' : 'none' }}>
        <ErModule
          active={isFocused && tab === 'er'}
          locationSnapshot={locationSnapshot}
          facilitySearch={facilitySearch}
          {...mapModuleShared}
        />
      </View>
      <View style={{ flex: 1, display: tab === 'pharmacy' ? 'flex' : 'none' }}>
        <PharmacyModule
          locationSnapshot={locationSnapshot}
          facilitySearch={facilitySearch}
          {...mapModuleShared}
        />
      </View>
      <View style={{ flex: 1, display: tab === 'pediatric' ? 'flex' : 'none' }}>
        <PediatricModule
          active={isFocused && tab === 'pediatric'}
          locationSnapshot={locationSnapshot}
          facilitySearch={facilitySearch}
          {...mapModuleShared}
        />
      </View>
    </View>
  );
}

type FacilitySearchState = ReturnType<typeof useFacilitySearchMode>;

const LIST_ESTIMATED_ITEM_SIZE = 96;

function AedModule({
  locationSnapshot,
  facilitySearch,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: {
  locationSnapshot: LocationSnapshot;
  facilitySearch: FacilitySearchState;
} & MapModuleSharedProps) {
  const [selectedAED, setSelectedAED] = useState<LocalAedMarker | null>(null);
  const [mapCenter, setMapCenter] = useState(() => getMapCenterFromSnapshot(locationSnapshot));

  const {
    mode,
    sido,
    sigungu,
    gpsLoading,
    searchParams,
    statusLabel,
    activateGpsSearch,
    handleSidoChange,
    handleSigunguChange,
  } = facilitySearch;

  const { data: markers = [], isFetching } = useFacilityMarkersQuery('aed', searchParams);

  const mapPoints = useMemo(() => toAedMapPoints(markers), [markers]);

  useEffect(() => {
    if (selectedAED) return;
    const nextCenter = getMapCenterFromSnapshot(locationSnapshot);
    if (nextCenter) setMapCenter(nextCenter);
  }, [locationSnapshot, selectedAED]);

  const handleMarkerPress = (marker: LocalAedMarker) => {
    setSelectedAED(marker);
    setMapCenter({ latitude: marker.latitude, longitude: marker.longitude });
  };

  const handleCloseSheet = () => {
    setSelectedAED(null);
  };

  return (
    <View className="flex-1">
      <View className="h-[42%] min-h-[220px] border-b border-slate-200">
        <EmergencyMapView
          points={mapPoints}
          kind="aed"
          selectedId={selectedAED?.id}
          loading={false}
          center={mapCenter}
          onMarkerPress={(point: { payload: LocalAedMarker }) => handleMarkerPress(point.payload)}
        />
      </View>

      <View className="px-4 py-3">
        <FacilitySearchBarComponent
          facilityLabel="AED"
          mode={mode}
          sido={sido}
          sigungu={sigungu}
          gpsLoading={gpsLoading}
          statusLabel={statusLabel}
          resultCount={markers.length}
          onActivateGps={() => void activateGpsSearch()}
          onSidoChange={handleSidoChange}
          onSigunguChange={handleSigunguChange}
        />
        {isFetching ? (
          <ActivityIndicator size="small" color="#64748b" className="mt-1" />
        ) : null}
      </View>

      <FlashList
        style={{ flex: 1 }}
        data={markers}
        estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        ListEmptyComponent={
          <EmptyState
            message={
              searchParams.textQuery || searchParams.regionFilter
                ? '해당 검색어의 AED를 찾을 수 없습니다'
                : '주변 AED를 찾을 수 없습니다'
            }
            hint="시·도 또는 시·군·구를 선택해 보세요"
          />
        }
        renderItem={({ item, index }) => (
          <MapMarkerShellCard
            name={item.name || 'AED'}
            distanceM={item.distanceM}
            walkMin={item.walkMin}
            icon="heart-circle"
            iconColor={index === 0 && mode === 'gps' ? '#dc2626' : '#64748b'}
            badge={index === 0 && mode === 'gps' ? '최단' : undefined}
            selected={selectedAED?.id === item.id}
            distanceUnitMode={distanceUnitMode}
            onDistanceUnitModeChange={onDistanceUnitModeChange}
            onPress={() => handleMarkerPress(item)}
          />
        )}
      />

      <MapMarkerDetailSheet
        visible={selectedAED !== null}
        title={selectedAED?.name || 'AED'}
        loading={false}
        onClose={handleCloseSheet}
      >
        {selectedAED ? (
          <AedDetailContent aed={selectedAED} distanceUnitMode={distanceUnitMode} onDistanceUnitToggle={() => onDistanceUnitModeChange(cycleDistanceUnitMode(distanceUnitMode))} />
        ) : null}
      </MapMarkerDetailSheet>
    </View>
  );
}

function AedDetailContent({
  aed,
  distanceUnitMode,
  onDistanceUnitToggle,
}: {
  aed: LocalAedMarker;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
}) {
  const hasCoords =
    Number.isFinite(aed.latitude) &&
    Number.isFinite(aed.longitude) &&
    !(aed.latitude === 0 && aed.longitude === 0);
  const phone = aed.phone?.trim();

  return (
    <View>
      <View className="mb-4 h-32 items-center justify-center rounded-xl bg-slate-100">
        <Ionicons name="map" size={40} color="#94a3b8" />
        <Text className="mt-2 text-xs text-slate-500">AED 설치 위치</Text>
        <Text className="text-xs text-slate-400">
          {hasCoords
            ? `${aed.latitude.toFixed(4)}, ${aed.longitude.toFixed(4)}`
            : '좌표 정보 없음'}
        </Text>
      </View>

      <Text className="text-sm font-semibold text-slate-900">{aed.name || 'AED'}</Text>
      <Text className="mt-1 text-sm text-slate-600">{aed.address?.trim() || '주소 정보 없음'}</Text>
      {aed.location?.trim() ? (
        <Text className="mt-1 text-sm text-slate-500">설치 위치: {aed.location}</Text>
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <InfoTile
          icon="navigate"
          label="거리"
          value={formatDistanceMeters(aed.distanceM ?? 0, distanceUnitMode)}
          onPress={onDistanceUnitToggle}
        />
        <InfoTile icon="walk" label="도보" value={`${aed.walkMin ?? 0}분`} />
        <InfoTile
          icon="hardware-chip"
          label="모델"
          value={aed.model?.trim() || '-'}
        />
      </View>

      {phone ? (
        <Pressable
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
          onPress={() => confirmPhoneCall(aed.name || 'AED', phone)}
        >
          <Text className="text-xs text-slate-500">관리자 연락처</Text>
          <Text className="text-sm font-bold text-blue-700">{phone}</Text>
        </Pressable>
      ) : (
        <Text className="mt-4 text-xs text-slate-500">관리자 연락처: -</Text>
      )}
      <Text className="mt-1 text-xs text-slate-400">로컬 내장 데이터 · 즉시 표시</Text>
    </View>
  );
}

function PediatricModule({
  active,
  locationSnapshot,
  facilitySearch,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: {
  active: boolean;
  locationSnapshot: LocationSnapshot;
  facilitySearch: FacilitySearchState;
} & MapModuleSharedProps) {
  const [hospitals, setHospitals] = useState<HospitalFinderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<HospitalFinderItem | null>(null);
  const [mapCenter, setMapCenter] = useState(() => getMapCenterFromSnapshot(locationSnapshot));
  const fetchRef = useRef(0);

  const {
    mode,
    sido,
    sigungu,
    gpsLoading,
    searchParams,
    statusLabel,
    activateGpsSearch,
    handleSidoChange,
    handleSigunguChange,
  } = facilitySearch;

  const apiRegion = useMemo(
    () => resolveErLiveApiRegion(searchParams, locationSnapshot),
    [searchParams, locationSnapshot],
  );

  const mapPoints = useMemo(() => toPediatricHospitalMapPoints(hospitals), [hospitals]);
  const moonlightCount = useMemo(
    () => hospitals.filter((item) => item.isMoonlightHospital).length,
    [hospitals],
  );

  useEffect(() => {
    if (!active) return undefined;

    const seq = ++fetchRef.current;
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        const result = await fetchPediatricHospitals({
          coordinate: locationSnapshot.coordinate,
          region: apiRegion,
        });
        if (seq !== fetchRef.current) return;
        const merged = mergeCustomHospitalsIntoPediatricList(
          result.items,
          locationSnapshot.coordinate,
          { stage1: apiRegion.stage1, stage2: apiRegion.stage2 },
        );
        setHospitals(merged);
        setErrorMessage(result.success ? null : result.errorMessage ?? '조회에 실패했습니다.');
        setLoading(false);
      })();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    active,
    apiRegion.stage1,
    apiRegion.stage2,
    apiRegion.label,
    locationSnapshot.coordinate.latitude,
    locationSnapshot.coordinate.longitude,
  ]);

  useEffect(() => {
    if (selectedPlace) return;
    const nextCenter = getMapCenterFromSnapshot(locationSnapshot);
    if (nextCenter) setMapCenter(nextCenter);
  }, [locationSnapshot, selectedPlace]);

  const handleMarkerPress = (place: HospitalFinderItem) => {
    setSelectedPlace(place);
    if (place.latitude && place.longitude) {
      setMapCenter({ latitude: place.latitude, longitude: place.longitude });
    }
  };

  const resync = () => {
    const seq = ++fetchRef.current;
    void (async () => {
      setLoading(true);
      const result = await fetchPediatricHospitals({
        coordinate: locationSnapshot.coordinate,
        region: apiRegion,
      });
      if (seq !== fetchRef.current) return;
      const merged = mergeCustomHospitalsIntoPediatricList(
        result.items,
        locationSnapshot.coordinate,
        { stage1: apiRegion.stage1, stage2: apiRegion.stage2 },
      );
      setHospitals(merged);
      setErrorMessage(result.success ? null : result.errorMessage ?? '조회에 실패했습니다.');
      setLoading(false);
    })();
  };

  return (
    <View className="flex-1">
      <View className="h-[42%] min-h-[220px] border-b border-slate-200">
        <EmergencyMapView
          points={mapPoints}
          kind="pediatric"
          selectedId={selectedPlace?.hpid}
          loading={loading}
          center={mapCenter}
          onMarkerPress={(point: { payload: HospitalFinderItem }) => handleMarkerPress(point.payload)}
        />
      </View>

      <FlashList
        style={{ flex: 1 }}
        data={hospitals}
        estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE + 56}
        keyExtractor={(item) => item.hpid}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="mb-2 gap-3">
            <FacilitySearchBarComponent
              facilityLabel="소아 의료기관"
              mode={mode}
              sido={sido}
              sigungu={sigungu}
              gpsLoading={gpsLoading}
              statusLabel={statusLabel}
              resultCount={hospitals.length}
              onActivateGps={() => void activateGpsSearch()}
              onSidoChange={handleSidoChange}
              onSigunguChange={handleSigunguChange}
            />
            <View className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
              <Text className="text-xs font-semibold text-indigo-900">
                {apiRegion.label} · 🌙 달빛어린이병원 {moonlightCount}곳 우선 표시
              </Text>
              <Text className="mt-0.5 text-[11px] text-indigo-700">
                국립중앙의료원 병·의원 찾기 API · 진료시간은 방문 전 전화 확인 권장
              </Text>
            </View>
            {loading ? <ActivityIndicator size="small" color="#7c3aed" /> : null}
            {errorMessage ? (
              <View className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Text className="text-sm text-amber-800">{errorMessage}</Text>
                <Pressable className="mt-2 self-start rounded-lg bg-amber-600 px-3 py-1.5" onPress={resync}>
                  <Text className="text-xs font-semibold text-white">다시 시도</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              message={
                searchParams.regionFilter
                  ? `${statusLabel} 소아 의료기관을 찾을 수 없습니다`
                  : '소아 의료기관 정보가 없습니다'
              }
              hint="시·도 또는 시·군·구를 선택해 보세요"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <PediatricHospitalCard
            hospital={item}
            selected={selectedPlace?.hpid === item.hpid}
            expanded={selectedPlace?.hpid === item.hpid}
            distanceUnitMode={distanceUnitMode}
            onDistanceUnitModeChange={onDistanceUnitModeChange}
            onPress={() => handleMarkerPress(item)}
          />
        )}
      />

      <MapMarkerDetailSheet
        visible={selectedPlace !== null}
        title={selectedPlace?.name || '소아 의료기관'}
        loading={false}
        onClose={() => setSelectedPlace(null)}
      >
        {selectedPlace ? (
          <PediatricHospitalDetailContent
            hospital={selectedPlace}
            distanceUnitMode={distanceUnitMode}
            onDistanceUnitToggle={() =>
              onDistanceUnitModeChange(cycleDistanceUnitMode(distanceUnitMode))
            }
          />
        ) : null}
      </MapMarkerDetailSheet>
    </View>
  );
}

function PediatricHospitalDetailContent({
  hospital,
  distanceUnitMode,
  onDistanceUnitToggle,
}: {
  hospital: HospitalFinderItem;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
}) {
  const phone = hospital.phone?.trim();

  return (
    <View>
      {hospital.isMoonlightHospital ? (
        <View className="mb-2">
          <MoonlightHospitalBadge />
        </View>
      ) : hospital.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge />
        </View>
      ) : null}

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-slate-900">{hospital.name}</Text>
        <View
          className={`rounded-full px-2.5 py-1 ${
            hospital.isOpenNow ? 'bg-green-100' : 'bg-slate-200'
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              hospital.isOpenNow ? 'text-green-700' : 'text-slate-600'
            }`}
          >
            {hospital.openStatusLabel}
          </Text>
        </View>
      </View>

      <Text className="text-sm text-slate-600">{hospital.address}</Text>
      {hospital.customMemo ? (
        <Text className="mt-2 text-xs leading-5 text-amber-800">{hospital.customMemo}</Text>
      ) : null}
      <Text className="mt-1 text-xs text-slate-500">{hospital.facilityType}</Text>

      <View className="mt-3">
        <Text className="mb-2 text-xs font-bold text-slate-700">진료 과목</Text>
        <HospitalSpecialtyTags specialties={hospital.specialties} maxTags={12} />
      </View>

      <View className="mt-4">
        <Text className="mb-2 text-xs font-bold text-slate-700">요일별 진료시간</Text>
        <HospitalWeeklyHours schedule={hospital.weeklySchedule} />
      </View>

      <View className="mt-4 flex-row gap-3">
        <InfoTile
          icon="navigate"
          label="거리"
          value={formatDistanceMeters(hospital.distanceM ?? 0, distanceUnitMode)}
          onPress={onDistanceUnitToggle}
        />
        <InfoTile icon="walk" label="도보" value={`${hospital.walkMin ?? 0}분`} />
        <InfoTile
          icon="call"
          label="전화"
          value={phone && phone !== '-' ? phone : '-'}
          onPress={phone && phone !== '-' ? () => confirmPhoneCall(hospital.name, phone) : undefined}
          valueColor={phone && phone !== '-' ? '#1d4ed8' : '#0f172a'}
        />
      </View>

      {hospital.description ? (
        <Text className="mt-3 text-xs leading-5 text-slate-500">{hospital.description}</Text>
      ) : null}
    </View>
  );
}

function PharmacyModule({
  locationSnapshot,
  facilitySearch,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: {
  locationSnapshot: LocationSnapshot;
  facilitySearch: FacilitySearchState;
} & MapModuleSharedProps) {
  const [selectedPlace, setSelectedPlace] = useState<LocalPharmacyMarker | null>(null);
  const [mapCenter, setMapCenter] = useState(() => getMapCenterFromSnapshot(locationSnapshot));

  const {
    mode,
    sido,
    sigungu,
    gpsLoading,
    searchParams,
    statusLabel,
    activateGpsSearch,
    handleSidoChange,
    handleSigunguChange,
  } = facilitySearch;

  const { data: markers = [], isFetching } = useFacilityMarkersQuery('pharmacy', searchParams);

  const mapPoints = useMemo(() => toLocalPharmacyMapPoints(markers), [markers]);

  useEffect(() => {
    if (selectedPlace) return;
    const nextCenter = getMapCenterFromSnapshot(locationSnapshot);
    if (nextCenter) setMapCenter(nextCenter);
  }, [locationSnapshot, selectedPlace]);

  const handleMarkerPress = (place: LocalPharmacyMarker) => {
    setSelectedPlace(place);
    setMapCenter({ latitude: place.lat, longitude: place.lng });
  };

  const handleCloseSheet = () => {
    setSelectedPlace(null);
  };

  return (
    <View className="flex-1">
      <View className="h-[42%] min-h-[220px] border-b border-slate-200">
        <EmergencyMapView
          points={mapPoints}
          kind="pharmacy"
          selectedId={selectedPlace?.i}
          loading={false}
          center={mapCenter}
          onMarkerPress={(point: { payload: LocalPharmacyMarker }) => handleMarkerPress(point.payload)}
        />
      </View>

      <View className="px-4 py-3">
        <FacilitySearchBarComponent
          facilityLabel="약국"
          mode={mode}
          sido={sido}
          sigungu={sigungu}
          gpsLoading={gpsLoading}
          statusLabel={statusLabel}
          resultCount={markers.length}
          onActivateGps={() => void activateGpsSearch()}
          onSidoChange={handleSidoChange}
          onSigunguChange={handleSigunguChange}
        />
        {isFetching ? (
          <ActivityIndicator size="small" color="#64748b" className="mt-1" />
        ) : null}
      </View>

      <FlashList
        style={{ flex: 1 }}
        data={markers}
        estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE}
        keyExtractor={(item) => item.i}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        ListEmptyComponent={
          <EmptyState
            message={
              searchParams.regionFilter
                ? `${statusLabel} 약국을 찾을 수 없습니다`
                : '주변 약국을 찾을 수 없습니다'
            }
            hint="시·도 또는 시·군·구를 선택해 보세요"
          />
        }
        renderItem={({ item }) => {
          const openStatus = getPharmacyOpenStatus(item);
          return (
            <MapMarkerShellCard
              name={item.n || '약국'}
              distanceM={item.distanceM}
              walkMin={item.walkMin}
              icon="medical"
              selected={selectedPlace?.i === item.i}
              distanceUnitMode={distanceUnitMode}
              onDistanceUnitModeChange={onDistanceUnitModeChange}
              statusBadge={
                openStatus.hasHours ? <PharmacyOpenBadge status={openStatus} compact /> : null
              }
              subtitle={
                openStatus.hasHours
                  ? `${openStatus.dayLabel} ${openStatus.hoursLabel}`
                  : undefined
              }
              onPress={() => handleMarkerPress(item)}
            />
          );
        }}
      />

      <MapMarkerDetailSheet
        visible={selectedPlace !== null}
        title={selectedPlace?.n || '약국'}
        loading={false}
        onClose={handleCloseSheet}
      >
        {selectedPlace ? (
          <PharmacyLocalDetailContent
            place={selectedPlace}
            distanceUnitMode={distanceUnitMode}
            onDistanceUnitToggle={() =>
              onDistanceUnitModeChange(cycleDistanceUnitMode(distanceUnitMode))
            }
          />
        ) : null}
      </MapMarkerDetailSheet>
    </View>
  );
}

function PharmacyLocalDetailContent({
  place,
  distanceUnitMode,
  onDistanceUnitToggle,
}: {
  place: LocalPharmacyMarker;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
}) {
  const hasCoords =
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng) &&
    !(place.lat === 0 && place.lng === 0);
  const openStatus = getPharmacyOpenStatus(place);
  const phone = place.p?.trim();

  return (
    <View>
      <Text className="text-sm font-semibold text-slate-900">{place.n || '약국'}</Text>
      <Text className="mt-1 text-sm text-slate-600">{place.a?.trim() || '주소 정보 없음'}</Text>

      {openStatus.hasHours ? (
        <View className="mt-3">
          <PharmacyOpenBadge status={openStatus} />
          <Text className="mt-2 text-sm text-slate-600">
            {openStatus.dayLabel} 영업시간: {openStatus.hoursLabel}
          </Text>
        </View>
      ) : (
        <Text className="mt-2 text-xs text-slate-400">심야약국 운영시간 데이터 없음</Text>
      )}

      <View className="mt-4 flex-row gap-3">
        <InfoTile
          icon="navigate"
          label="거리"
          value={formatDistanceMeters(place.distanceM ?? 0, distanceUnitMode)}
          onPress={onDistanceUnitToggle}
        />
        <InfoTile icon="walk" label="도보" value={`${place.walkMin ?? 0}분`} />
        <InfoTile
          icon="call"
          label="전화"
          value={phone || '-'}
          onPress={phone ? () => confirmPhoneCall(place.n || '약국', phone) : undefined}
          valueColor={phone ? '#1d4ed8' : '#0f172a'}
        />
      </View>

      {hasCoords ? (
        <Text className="mt-3 text-xs text-slate-400">
          좌표: {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
        </Text>
      ) : null}
      <Text className="mt-1 text-xs text-slate-400">로컬 내장 데이터 · 즉시 표시</Text>
    </View>
  );
}

function ErModule({
  active,
  locationSnapshot,
  facilitySearch,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: {
  active: boolean;
  locationSnapshot: LocationSnapshot;
  facilitySearch: FacilitySearchState;
} & MapModuleSharedProps) {
  const [regionLabel, setRegionLabel] = useState(locationSnapshot.region.label);
  const [liveOverlay, setLiveOverlay] = useState<ErLiveOverlayResult | null>(null);
  const [liveSyncing, setLiveSyncing] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<LocalHospitalMarkerWithLive | null>(null);
  const [mapCenter, setMapCenter] = useState(() => getMapCenterFromSnapshot(locationSnapshot));
  const [metadataIndex, setMetadataIndex] = useState<Map<string, HospitalMetadataEntry> | null>(null);
  const liveSyncRef = useRef(0);
  const metadataSyncRef = useRef(0);

  const {
    mode,
    sido,
    sigungu,
    gpsLoading,
    searchParams,
    statusLabel,
    activateGpsSearch,
    handleSidoChange,
    handleSigunguChange,
  } = facilitySearch;

  const { data: baseMarkers = [], isFetching: markersFetching } = useFacilityMarkersQuery(
    'hospital',
    searchParams,
    { erOnly: false },
  );

  const liveApiRegion = useMemo(
    () => resolveErLiveApiRegion(searchParams, locationSnapshot),
    [searchParams, locationSnapshot],
  );

  const allMarkers = useMemo(() => {
    const merged = applyErLiveOverlayToLocal(baseMarkers, liveOverlay);
    const enriched = enrichErMarkersWithMetadata(merged, metadataIndex);
    return sortErTabHospitals(enriched);
  }, [baseMarkers, liveOverlay, metadataIndex]);

  const mapPoints = useMemo(() => toLocalHospitalMapPoints(allMarkers), [allMarkers]);

  useEffect(() => {
    if (selectedPlace) return;
    const nextCenter = getMapCenterFromSnapshot(locationSnapshot);
    if (nextCenter) setMapCenter(nextCenter);
  }, [locationSnapshot, selectedPlace]);

  useEffect(() => {
    setRegionLabel(liveApiRegion.label);
  }, [liveApiRegion.label]);

  useEffect(() => {
    if (!active) return undefined;

    const seq = ++metadataSyncRef.current;
    const timer = setTimeout(() => {
      void (async () => {
        const index = await fetchRegionalHospitalMetadataIndex(liveApiRegion);
        if (seq !== metadataSyncRef.current) return;
        setMetadataIndex(index);
      })();
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [
    active,
    liveApiRegion.stage1,
    liveApiRegion.stage2,
    liveApiRegion.label,
  ]);

  useEffect(() => {
    if (!active) return undefined;

    const seq = ++liveSyncRef.current;
    const timer = setTimeout(() => {
      void (async () => {
        setLiveSyncing(true);
        const overlay = await fetchErLiveOverlay(liveApiRegion);
        if (seq !== liveSyncRef.current) return;
        setLiveOverlay(overlay);
        setLiveSyncing(false);
      })();
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [
    active,
    liveApiRegion.stage1,
    liveApiRegion.stage2,
    liveApiRegion.label,
  ]);

  useEffect(() => {
    if (!active) return undefined;
    return subscribeToLocationUpdates((snapshot) => {
      if (!snapshot.permissionGranted) return;
      if (searchParams.mode !== 'gps' || searchParams.textQuery) return;
      const seq = ++liveSyncRef.current;
      void (async () => {
        const overlay = await fetchErLiveOverlay(resolveErLiveApiRegion(searchParams, snapshot));
        if (seq !== liveSyncRef.current) return;
        setLiveOverlay(overlay);
      })();
    });
  }, [active, searchParams]);

  const dashboardStats = useMemo(() => {
    if (liveOverlay?.success) {
      return {
        ...liveOverlay.stats,
        ready: true,
      };
    }
    return {
      totalHospitals: 0,
      totalAvailableBeds: 0,
      availableCount: 0,
      congestedCount: 0,
      fullCount: 0,
      pediatricCount: 0,
      ready: false,
    };
  }, [liveOverlay]);

  const pediatricCount = dashboardStats.ready
    ? dashboardStats.pediatricCount
    : allMarkers.filter((item) => item.isPediatricPriority).length;

  const erPriorityCount = allMarkers.filter((item) => item.isErPriority).length;

  const handleMarkerPress = (place: LocalHospitalMarkerWithLive) => {
    setSelectedPlace(place);
    setMapCenter({ latitude: place.lat, longitude: place.lng });
  };

  const handleCloseSheet = () => {
    setSelectedPlace(null);
  };

  const resyncLive = () => {
    const seq = ++liveSyncRef.current;
    void (async () => {
      setLiveSyncing(true);
      const overlay = await fetchErLiveOverlay(liveApiRegion);
      if (seq !== liveSyncRef.current) return;
      setLiveOverlay(overlay);
      setLiveSyncing(false);
    })();
  };

  return (
    <View className="flex-1">
      <View className="h-[42%] min-h-[220px] border-b border-slate-200">
        <EmergencyMapView
          points={mapPoints}
          kind="er"
          selectedId={selectedPlace?.i}
          loading={liveSyncing}
          center={mapCenter}
          onMarkerPress={(point: { payload: LocalHospitalMarkerWithLive }) =>
            handleMarkerPress(point.payload)
          }
        />
      </View>

      <FlashList
        style={{ flex: 1 }}
        data={allMarkers}
        estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE + 40}
        keyExtractor={(item) => item.i}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="mb-2 gap-3">
            <FacilitySearchBarComponent
              facilityLabel="병원"
              mode={mode}
              sido={sido}
              sigungu={sigungu}
              gpsLoading={gpsLoading}
              statusLabel={statusLabel}
              resultCount={allMarkers.length}
              onActivateGps={() => void activateGpsSearch()}
              onSidoChange={handleSidoChange}
              onSigunguChange={handleSigunguChange}
            />
            {markersFetching ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : null}
            <ErDashboardSummary
              regionLabel={
                searchParams.mode === 'gps' && !searchParams.textQuery
                  ? `${regionLabel} · 🚨응급실 ${erPriorityCount}곳 · 👶소아 ${pediatricCount}곳 · GPS 거리순`
                  : `${liveApiRegion.label} · 🚨응급실 ${erPriorityCount}곳 · 👶소아 ${pediatricCount}곳`
              }
              totalHospitals={dashboardStats.totalHospitals}
              totalAvailableBeds={dashboardStats.totalAvailableBeds}
              availableCount={dashboardStats.availableCount}
              congestedCount={dashboardStats.congestedCount}
              fullCount={dashboardStats.fullCount}
              loading={liveSyncing && !dashboardStats.ready}
              unavailable={!liveSyncing && liveOverlay !== null && !liveOverlay.success}
            />
            {liveOverlay && !liveOverlay.success ? (
              <View className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Text className="text-sm text-amber-800">{LIVE_STATUS_FALLBACK_MESSAGE}</Text>
                <Pressable
                  className="mt-2 self-start rounded-lg bg-amber-600 px-3 py-1.5"
                  onPress={resyncLive}
                >
                  <Text className="text-xs font-semibold text-white">실시간 정보 다시 시도</Text>
                </Pressable>
              </View>
            ) : liveSyncing ? (
              <Text className="text-xs text-slate-400">실시간 병상 정보 동기화 중...</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            message={
              searchParams.textQuery || searchParams.regionFilter
                ? `'${searchParams.textQuery || statusLabel}' 검색 결과가 없습니다`
                : '주변 응급실 정보가 없습니다'
            }
            hint="시·도 또는 시·군·구를 선택해 보세요"
          />
        }
        renderItem={({ item }) => (
          <ErMarkerCard
            place={item}
            selected={selectedPlace?.i === item.i}
            distanceUnitMode={distanceUnitMode}
            onDistanceUnitModeChange={onDistanceUnitModeChange}
            onPress={() => handleMarkerPress(item)}
          />
        )}
      />

      <MapMarkerDetailSheet
        visible={selectedPlace !== null}
        title={selectedPlace?.n || '응급실'}
        loading={false}
        onClose={handleCloseSheet}
      >
        {selectedPlace ? (
          <ErLocalDetailContent
            place={selectedPlace}
            liveOverlay={liveOverlay}
            liveApiRegion={liveApiRegion}
            coordinate={locationSnapshot.coordinate}
            distanceUnitMode={distanceUnitMode}
            onDistanceUnitToggle={() =>
              onDistanceUnitModeChange(cycleDistanceUnitMode(distanceUnitMode))
            }
          />
        ) : null}
      </MapMarkerDetailSheet>
    </View>
  );
}

function ErMarkerCard({
  place,
  selected,
  distanceUnitMode,
  onDistanceUnitModeChange,
  onPress,
}: {
  place: LocalHospitalMarkerWithLive;
  selected: boolean;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitModeChange: (mode: DistanceUnitMode) => void;
  onPress: () => void;
}) {
  const status = safeErStatus(place.status);
  const availableErBeds = Number.isFinite(place.availableErBeds) ? place.availableErBeds : 0;
  const isMoonlight = isMoonlightChildrenHospital(place.n);
  const todayCode = getTreatmentDayCode();
  const todaySchedule = place.weeklySchedule?.find((day) => day.dayCode === todayCode) ?? null;

  const borderClass = place.isErPriority
    ? selected
      ? 'border-red-400 bg-red-50'
      : 'border-red-200'
    : isMoonlight
      ? selected
        ? 'border-indigo-400 bg-indigo-50'
        : 'border-indigo-200'
      : place.isPediatricPriority
        ? selected
          ? 'border-pink-400 bg-pink-50'
          : 'border-pink-200'
        : selected
          ? 'border-slate-300 bg-slate-50'
          : 'border-slate-200';

  return (
    <Pressable className={`mb-3 rounded-2xl border bg-white p-4 ${borderClass}`} onPress={onPress}>
      {place.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge compact />
        </View>
      ) : null}
      {place.isErPriority ? (
        <View className="mb-2 self-start rounded-full bg-red-100 px-2.5 py-1">
          <Text className="text-xs font-bold text-red-700">🚨 응급실 운영</Text>
        </View>
      ) : isMoonlight ? (
        <View className="mb-2">
          <MoonlightHospitalBadge compact />
        </View>
      ) : place.isPediatricPriority ? (
        <View className="mb-2 self-start rounded-full bg-pink-100 px-2.5 py-1">
          <Text className="text-xs font-bold text-pink-700">👶 소아 특화</Text>
        </View>
      ) : null}

      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-bold text-slate-900">{place.n || '병원'}</Text>
        <View className="flex-row items-center gap-1.5">
          {place.openStatusLabel !== '확인 필요' ? (
            <View
              className={`rounded-full px-2 py-0.5 ${
                place.isOpenNow ? 'bg-green-100' : 'bg-slate-200'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  place.isOpenNow ? 'text-green-700' : 'text-slate-600'
                }`}
              >
                {place.openStatusLabel}
              </Text>
            </View>
          ) : null}
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: `${ER_STATUS_COLORS[status]}18` }}
          >
            <Text className="text-xs font-bold" style={{ color: ER_STATUS_COLORS[status] }}>
              {place.liveSynced ? ER_STATUS_LABELS[status] : '확인중'}
            </Text>
          </View>
        </View>
      </View>

      {place.customMemo ? (
        <Text className="mt-2 text-xs leading-5 text-slate-500">{place.customMemo}</Text>
      ) : null}

      {place.specialties && place.specialties.length > 0 ? (
        <View className="mt-2">
          <HospitalSpecialtyTags specialties={place.specialties} maxTags={4} />
        </View>
      ) : null}

      {todaySchedule ? (
        <Text className="mt-2 text-xs text-slate-500">
          오늘:{' '}
          {todaySchedule.closed || (!todaySchedule.start && !todaySchedule.end)
            ? '휴무'
            : `${todaySchedule.start} ~ ${todaySchedule.end}`}
        </Text>
      ) : null}

      <View className="mt-3">
        <BedAvailabilityBar available={availableErBeds} status={status} />
      </View>
      {place.specs || getHospitalErOverride(place.i) ? (
        <ErHospitalSpecsPanel
          specs={mergeSpecsWithErOverride(place.specs, getHospitalErOverride(place.i))}
          hospitalName={place.n || '병원'}
          compact
        />
      ) : null}
      {place.liveFailed ? (
        <Text className="mt-2 text-xs text-amber-700">{LIVE_STATUS_FALLBACK_MESSAGE}</Text>
      ) : null}
      <View className="mt-3 flex-row items-center gap-3">
        {place.distanceM > 0 ? (
          <View className="flex-row items-center">
            <Ionicons name="walk-outline" size={14} color="#64748b" />
            <DistanceText
              distanceM={place.distanceM}
              walkMin={place.walkMin}
              unitMode={distanceUnitMode}
              onUnitModeChange={onDistanceUnitModeChange}
              textStyle={{ fontSize: 14, color: '#475569' }}
            />
          </View>
        ) : (
          <Text className="text-xs text-slate-400">탭하여 주소·전화·상세 병상 확인</Text>
        )}
        {place.availablePediatricErBeds > 0 ? (
          <Text className="text-xs font-semibold text-pink-700">
            소아 {place.availablePediatricErBeds}병상
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ErLocalDetailContent({
  place,
  liveOverlay,
  liveApiRegion,
  coordinate,
  distanceUnitMode,
  onDistanceUnitToggle,
}: {
  place: LocalHospitalMarkerWithLive;
  liveOverlay?: ErLiveOverlayResult | null;
  liveApiRegion: LocationRegion;
  coordinate: { latitude: number; longitude: number };
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
}) {
  const [detail, setDetail] = useState<HospitalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setDetailError(null);

    if (!place.i) return undefined;

    void (async () => {
      setDetailLoading(true);
      const result = await fetchErHospitalFullDetail(place.i, {
        coordinate,
        region: liveApiRegion,
      });

      if (cancelled) return;

      if (result) {
        setDetail(result);
      } else {
        const fallback = getHybridHospitalDetailFromStore(place.i, coordinate, liveOverlay ?? null);
        if (fallback) {
          setDetail({
            ...fallback,
            specialties: place.specialties?.length ? place.specialties : fallback.specialties,
            weeklySchedule: place.weeklySchedule?.length
              ? place.weeklySchedule
              : fallback.weeklySchedule,
            isOpenNow: place.openStatusLabel !== '확인 필요' ? place.isOpenNow : fallback.isOpenNow,
            openStatusLabel:
              place.openStatusLabel !== '확인 필요'
                ? place.openStatusLabel
                : fallback.openStatusLabel,
          });
        } else {
          setDetailError('상세 정보를 불러오지 못했습니다. 아래 기본 정보를 참고해 주세요.');
        }
      }
      setDetailLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [place.i, liveApiRegion.stage1, liveApiRegion.stage2, liveApiRegion.label]);

  const status = safeErStatus(detail?.status ?? place.status);
  const availableErBeds = Number.isFinite(detail?.availableErBeds ?? place.availableErBeds)
    ? (detail?.availableErBeds ?? place.availableErBeds)
    : 0;
  const availablePediatricBeds = Number.isFinite(
    detail?.availablePediatricErBeds ?? place.availablePediatricErBeds,
  )
    ? (detail?.availablePediatricErBeds ?? place.availablePediatricErBeds)
    : 0;
  const liveFailed = liveOverlay !== undefined && liveOverlay !== null && !liveOverlay.success;
  const hasCoords =
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng) &&
    !(place.lat === 0 && place.lng === 0);
  const phone = (detail?.phone || place.p)?.trim();
  const erPhone = (detail?.erPhone || detail?.erDoctorPhone || place.p)?.trim();
  const callPhone =
    [erPhone, phone].find((value) => value && value !== '-') ?? null;
  const isMoonlight = isMoonlightChildrenHospital(place.n);
  const specialties = detail?.specialties?.length ? detail.specialties : place.specialties ?? [];
  const weeklySchedule = detail?.weeklySchedule?.length ? detail.weeklySchedule : place.weeklySchedule ?? [];
  const openStatusLabel = detail?.openStatusLabel ?? place.openStatusLabel;
  const isOpenNow = detail?.isOpenNow ?? place.isOpenNow;
  const erOverride = getHospitalErOverride(place.i);
  const hospitalSpecs = (() => {
    if (detail) {
      const merged = mergeEmergencyBedWithOverride(detail, erOverride);
      return mergeSpecsWithErOverride(buildEmergencyHospitalSpecs(merged), erOverride);
    }
    return mergeSpecsWithErOverride(place.specs, erOverride);
  })();

  const bedRows = detail
    ? [
        { label: '응급실', value: detail.availableErBeds },
        { label: '소아응급', value: detail.availablePediatricErBeds },
        { label: '수술실', value: detail.availableSurgeryBeds },
        { label: '신경중환자', value: detail.availableNeuroIcuBeds },
        { label: '신생아중환자', value: detail.availableNeonatalIcuBeds },
        { label: '흉부중환자', value: detail.availableChestIcuBeds },
        { label: '일반중환자', value: detail.availableGeneralIcuBeds },
        { label: '입원실', value: detail.availableInpatientBeds },
      ].filter((row) => row.value > 0 || row.label === '응급실' || row.label === '소아응급')
    : [];

  return (
    <View>
      {detailLoading ? (
        <View className="mb-3 items-center py-4">
          <ActivityIndicator size="small" color="#64748b" />
          <Text className="mt-2 text-xs text-slate-400">실시간 병상·기관 정보 불러오는 중...</Text>
        </View>
      ) : null}

      {detailError ? (
        <View className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Text className="text-sm text-amber-800">{detailError}</Text>
        </View>
      ) : null}

      {liveFailed ? (
        <View className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Text className="text-sm text-amber-800">{LIVE_STATUS_FALLBACK_MESSAGE}</Text>
        </View>
      ) : null}

      {place.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge compact />
        </View>
      ) : null}

      {place.isErPriority ? (
        <View className="mb-2 self-start rounded-full bg-red-100 px-2.5 py-1">
          <Text className="text-xs font-bold text-red-700">🚨 응급실 운영</Text>
        </View>
      ) : isMoonlight ? (
        <View className="mb-2">
          <MoonlightHospitalBadge compact />
        </View>
      ) : place.isPediatricPriority ? (
        <View className="mb-2 self-start rounded-full bg-pink-100 px-2.5 py-1">
          <Text className="text-xs font-bold text-pink-700">👶 소아 특화</Text>
        </View>
      ) : null}

      <ErDutyContactButtons
        specs={hospitalSpecs}
        hospitalName={detail?.hospitalName || place.n || '병원'}
      />

      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-900">
            {detail?.hospitalName || place.n || '병원'}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">
            {detail?.address?.trim() || place.a?.trim() || '주소 정보 없음'}
          </Text>
          {(detail?.emergencyClassName || place.td)?.trim() ? (
            <Text className="mt-1 text-sm text-slate-500">
              {detail?.emergencyClassName || place.td}
            </Text>
          ) : null}
          {place.sg?.trim() ? (
            <Text className="mt-1 text-xs text-slate-400">{place.sg}</Text>
          ) : null}
          {openStatusLabel !== '확인 필요' ? (
            <View
              className={`mt-2 self-start rounded-full px-2.5 py-1 ${
                isOpenNow ? 'bg-green-100' : 'bg-slate-200'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  isOpenNow ? 'text-green-700' : 'text-slate-600'
                }`}
              >
                {openStatusLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {callPhone ? (
          <Pressable
            className="items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 shadow-sm"
            onPress={() => confirmPhoneCall(place.n || '병원', callPhone)}
            accessibilityRole="button"
            accessibilityLabel="전화하기"
          >
            <Ionicons name="call" size={22} color="#ffffff" />
            <Text className="mt-1 text-xs font-bold text-white">전화하기</Text>
            {erPhone && erPhone === callPhone ? (
              <Text className="mt-0.5 text-[10px] text-blue-100">응급실</Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      <ErHospitalSpecsPanel
        specs={hospitalSpecs}
        hospitalName={detail?.hospitalName || place.n || '병원'}
        showDutyContacts={false}
      />

      {specialties.length > 0 ? (
        <View className="mt-3">
          <Text className="mb-2 text-xs font-bold text-slate-700">진료 과목</Text>
          <HospitalSpecialtyTags specialties={specialties} maxTags={12} />
        </View>
      ) : null}

      {weeklySchedule.length > 0 ? (
        <View className="mt-4">
          <Text className="mb-2 text-xs font-bold text-slate-700">요일별 진료시간</Text>
          <HospitalWeeklyHours schedule={weeklySchedule} />
        </View>
      ) : null}

      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-slate-700">응급실 병상</Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${ER_STATUS_COLORS[status]}18` }}
        >
          <Text className="text-xs font-bold" style={{ color: ER_STATUS_COLORS[status] }}>
            {place.liveSynced || detail ? ER_STATUS_LABELS[status] : '확인중'}
          </Text>
        </View>
      </View>

      <View className="mt-2">
        <BedAvailabilityBar available={availableErBeds} status={status} />
      </View>

      {bedRows.length > 0 ? (
        <View className="mt-3 rounded-xl bg-slate-50 p-3">
          <Text className="mb-2 text-xs font-bold text-slate-700">가용 병상 현황</Text>
          {bedRows.map((row) => (
            <View key={row.label} className="flex-row items-center justify-between py-1">
              <Text className="text-xs text-slate-600">{row.label}</Text>
              <Text className="text-xs font-semibold text-slate-900">{row.value}병상</Text>
            </View>
          ))}
        </View>
      ) : availablePediatricBeds > 0 ? (
        <View className="mt-2 rounded-lg bg-pink-50 px-3 py-2">
          <Text className="text-xs font-semibold text-pink-700">
            소아 응급 가용 병상: {formatCount(availablePediatricBeds, '0')}병상
          </Text>
        </View>
      ) : null}

      {detail?.onCallDoctor?.trim() ? (
        <Text className="mt-3 text-xs text-slate-500">
          당직의: {detail.onCallDoctor}
        </Text>
      ) : null}

      {detail?.updatedAt ? (
        <Text className="mt-1 text-xs text-slate-400">
          갱신: {formatEmergencyUpdatedAt(detail.updatedAt)}
        </Text>
      ) : null}

      {detail?.description?.trim() ? (
        <Text className="mt-3 text-xs leading-5 text-slate-500">{detail.description}</Text>
      ) : null}

      {place.customMemo ? (
        <View className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <Text className="text-xs font-semibold text-amber-800">안내</Text>
          <Text className="mt-1 text-xs leading-5 text-amber-900">{place.customMemo}</Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <InfoTile
          icon="navigate"
          label="거리"
          value={formatDistanceMeters(place.distanceM ?? 0, distanceUnitMode)}
          onPress={onDistanceUnitToggle}
        />
        <InfoTile icon="walk" label="도보" value={`${place.walkMin ?? 0}분`} />
      </View>

      {hasCoords ? (
        <Text className="mt-3 text-xs text-slate-400">
          좌표: {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
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
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={18} color="#64748b" />
      <Text className="mt-1 text-xs text-slate-500">{label}</Text>
      <Text className="text-sm font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
    </>
  );

  if (!onPress) {
    return <View className="flex-1 rounded-xl bg-slate-50 p-3">{content}</View>;
  }

  return (
    <Pressable
      className="flex-1 rounded-xl bg-slate-50 p-3"
      onPress={onPress}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}
