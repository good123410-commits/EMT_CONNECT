import { FlashList } from '@shopify/flash-list';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
} from 'react-native';
import { BedAvailabilityBar } from '@/components/ErDashboard';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { ErDutyContactButtons, ErHospitalSpecsPanel } from '@/components/facility/ErHospitalSpecsPanel';
import { FacilitySearchBarComponent } from '@/components/facility/FacilitySearchBarComponent';
import { PediatricHospitalCard } from '@/components/facility/PediatricHospitalCard';
import { PediatricLocalDetailContent } from '@/components/facility/PediatricLocalDetailContent';
import { PharmacyLocalDetailContent } from '@/components/facility/PharmacyLocalDetailContent';
import { PharmacyNightPharmacyBadge } from '@/components/facility/PharmacyNightPharmacyBadge';
import {
  MedicalFacilityListCard,
  MedicalFacilityListDistanceRow,
  MedicalFacilityListTitleRow,
  MedicalFacilityStatusPill,
} from '@/components/facility/MedicalFacilityListCard';
import { PartnerHospitalBadge } from '@/components/facility/PartnerHospitalBadge';
import { HospitalSpecialtyTags } from '@/components/facility/HospitalSpecialtyTags';
import { HospitalWeeklyHours } from '@/components/facility/HospitalWeeklyHours';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import {
  MedicalDetailBody,
  MedicalDetailCard,
  MedicalDetailInfoTile,
  MedicalDetailLocationHeader,
  MedicalDetailSectionTitle,
  MedicalDetailText,
} from '@/components/map/MedicalDetailPrimitives';
import { PharmacyOpenBadge } from '@/components/map/PharmacyOpenBadge';
import { MedicalMapCategoryBar } from '@/components/map/MedicalMapCategoryBar';
import { MapListFadeIn } from '@/components/map/MapListFadeIn';
import { useFacilitySearchMode } from '@/hooks/useFacilitySearchMode';
import { usePediatricHospitalsQuery } from '@/hooks/usePediatricHospitalsQuery';
import { useShelterMarkersQuery } from '@/hooks/useShelterMarkersQuery';
import { usePharmacyMarkersQuery } from '@/hooks/usePharmacyMarkersQuery';
import {
  useFacilityMarkersQuery,
} from '@/hooks/useFacilityMarkersQuery';
import { warmAedSearchIndex } from '@/services/localAedStore';
import { ER_STATUS_COLORS, ER_STATUS_LABELS } from '@/mockData/aedAndEmergency';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import {
  EmergencyApiError,
  formatCount,
  formatEmergencyUpdatedAt,
  isMoonlightChildrenHospital,
  safeErStatus,
  type HospitalDetail,
} from '@/services/emergencyApi';

import {
  fetchRegionalHospitalMetadataIndex,
  type HospitalFinderItem,
  type HospitalMetadataEntry,
} from '@/services/hospitalFinderService';
import { ensureCustomHospitalDbHydrated } from '@/services/customHospitalService';
import {
  applyErLiveOverlayToLocal,
  enrichErMarkersWithMetadata,
  fetchErHospitalFullDetail,
  getHybridHospitalDetailFromStore,
  resolveErLiveApiRegion,
  sortErTabHospitals,
  type LocalHospitalMarkerWithLive,
} from '@/services/hybridErService';
import {
  getLocationWithRegionImmediate,
  subscribeToLocationUpdates,
  type LocationRegion,
  type LocationSnapshot,
} from '@/services/locationService';
import type { LocalPharmacyMarker } from '@/types/localFacility';
import { MapMarkerDetailSheet } from '@/components/map/MapMarkerDetailSheet';
import { buildEmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';
import { getHospitalErOverride } from '@/services/customHospitalService';
import { mergeEmergencyBedWithOverride, mergeSpecsWithErOverride } from '@/utils/hospitalEquipmentOverride';
import {
  cycleDistanceUnitMode,
  formatDistanceMeters,
  type DistanceUnitMode,
} from '@/utils/formatDistance';
import { getPharmacyOpenStatus, isTodayNightPharmacy, type PharmacyOpenStatus } from '@/utils/pharmacyHours';
import {
  getPharmacyListCardVariant,
  sortPharmaciesForListView,
  type PharmacyListViewMode,
} from '@/utils/pharmacyListSort';
import { getTreatmentDayCode } from '@/utils/hospitalHours';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import type { LocalAedMarker } from '@/types/localAed';
import type { LocalShelterMarker } from '@/types/shelter';
import type { MedicalMapTab } from '@/types/medicalMap';

const PrivateEmsCallScreen = createDeferredScreen(
  () => require('@/screens/PrivateEmsCallScreen').PrivateEmsCallScreen,
);

type MapModuleSharedProps = {
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitModeChange: (mode: DistanceUnitMode) => void;
};

type MapScreenParams = {
  initialTab?: MedicalMapTab;
};

export function MapScreen() {
  const route = useRoute();
  const routeParams = route.params as MapScreenParams | undefined;
  const isFocused = useIsFocused();
  const [tab, setTab] = useState<MedicalMapTab>(routeParams?.initialTab ?? 'aed');
  const [distanceUnitMode, setDistanceUnitMode] = useState<DistanceUnitMode>('auto');
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot>(() =>
    getLocationWithRegionImmediate(),
  );

  useEffect(() => {
    if (routeParams?.initialTab) {
      setTab(routeParams.initialTab);
    }
  }, [routeParams?.initialTab]);

  const handleDistanceUnitChange = (mode: DistanceUnitMode) => {
    setDistanceUnitMode(mode);
  };

  const mapModuleShared: MapModuleSharedProps = {
    distanceUnitMode,
    onDistanceUnitModeChange: handleDistanceUnitChange,
  };

  useEffect(() => {
    if (!isFocused) return;
    return subscribeToLocationUpdates(setLocationSnapshot);
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    void ensureCustomHospitalDbHydrated();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    warmAedSearchIndex();
  }, [isFocused]);

  return (
    <View className="flex-1 bg-kemix-bg">
      <MedicalMapCategoryBar value={tab} onChange={setTab} />
      <View className="flex-1">
        {tab === 'aed' ? (
          <AedModule active={isFocused} locationSnapshot={locationSnapshot} {...mapModuleShared} />
        ) : null}
        {tab === 'er' ? (
          <ErModule active={isFocused} locationSnapshot={locationSnapshot} {...mapModuleShared} />
        ) : null}
        {tab === 'pharmacy' ? (
          <PharmacyModule active={isFocused} locationSnapshot={locationSnapshot} {...mapModuleShared} />
        ) : null}
        {tab === 'pediatric' ? (
          <PediatricModule active={isFocused} locationSnapshot={locationSnapshot} {...mapModuleShared} />
        ) : null}
        {tab === 'shelter' ? (
          <ShelterModule active={isFocused} locationSnapshot={locationSnapshot} {...mapModuleShared} />
        ) : null}
        {tab === 'privateEms' ? <PrivateEmsCallScreen /> : null}
      </View>
    </View>
  );
}

type MapModuleBaseProps = {
  locationSnapshot: LocationSnapshot;
  active?: boolean;
} & MapModuleSharedProps;

const LIST_ESTIMATED_ITEM_SIZE = 96;
const MAP_FILTER_BAR_CLASS = 'border-b border-kemix-border px-4 py-2.5';
const MAP_LIST_CONTENT_STYLE = { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 };

function AedModule({
  active = true,
  locationSnapshot,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: MapModuleBaseProps) {
  const facilitySearch = useFacilitySearchMode({ locationSnapshot });

  const [selectedAED, setSelectedAED] = useState<LocalAedMarker | null>(null);

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

  const { data: markers = [], isFetching, isInitialLoad } = useFacilityMarkersQuery(
    'aed',
    searchParams,
    undefined,
    active,
  );
  const listMarkers = useDeferredValue(markers);

  const handleItemPress = (marker: LocalAedMarker) => {
    setSelectedAED(marker);
  };

  const handleCloseSheet = () => {
    setSelectedAED(null);
  };

  return (
    <View className="flex-1">
      <View className={MAP_FILTER_BAR_CLASS}>
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
        {isFetching && !isInitialLoad && markers.length > 0 ? (
          <ActivityIndicator size="small" color="#64748b" className="mt-2" />
        ) : null}
      </View>

      <MapListFadeIn loading={isInitialLoad} hasData={markers.length > 0}>
        <FlashList
          style={{ flex: 1 }}
          data={listMarkers}
          estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE}
          keyExtractor={(item) => item.id}
          contentContainerStyle={MAP_LIST_CONTENT_STYLE}
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
            <MedicalFacilityListCard
              variant={index === 0 && mode === 'gps' ? 'aed' : 'default'}
              selected={selectedAED?.id === item.id}
              onPress={() => handleItemPress(item)}
            >
              {index === 0 && mode === 'gps' ? (
                <View className="mb-2 self-start">
                  <MedicalFacilityStatusPill label="최단" tone="er" />
                </View>
              ) : null}
              <MedicalFacilityListTitleRow title={item.name || 'AED'} />
              {item.address?.trim() ? (
                <Text className="mt-1 text-sm text-kemix-text-secondary" numberOfLines={2}>
                  {item.address.trim()}
                </Text>
              ) : null}
              {item.location?.trim() ? (
                <Text className="mt-1 text-xs text-kemix-text-secondary" numberOfLines={1}>
                  {item.location.trim()}
                </Text>
              ) : null}
              <MedicalFacilityListDistanceRow
                distanceM={item.distanceM}
                walkMin={item.walkMin}
                distanceUnitMode={distanceUnitMode}
                onDistanceUnitModeChange={onDistanceUnitModeChange}
                hint="탭하여 상세 정보 보기"
              />
            </MedicalFacilityListCard>
          )}
        />
      </MapListFadeIn>

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
  const phone = aed.phone?.trim();

  const titleExtras = aed.location?.trim() ? (
    <MedicalDetailText variant="secondary">설치 위치: {aed.location}</MedicalDetailText>
  ) : null;

  const distanceBlock = (
    <View className="flex-row gap-3">
      <MedicalDetailInfoTile
        icon="navigate"
        label="거리"
        value={formatDistanceMeters(aed.distanceM ?? 0, distanceUnitMode)}
        onPress={onDistanceUnitToggle}
      />
      <MedicalDetailInfoTile icon="walk" label="도보" value={`${aed.walkMin ?? 0}분`} />
      <MedicalDetailInfoTile icon="hardware-chip" label="모델" value={aed.model?.trim() || '-'} />
    </View>
  );

  return (
    <MedicalDetailBody>
      <MedicalDetailLocationHeader
        name={aed.name || 'AED'}
        address={aed.address}
        latitude={aed.latitude}
        longitude={aed.longitude}
        phone={phone}
        mapKind="aed"
        titleExtras={titleExtras}
        distanceBlock={distanceBlock}
      />
      <MedicalDetailText variant="muted">로컬 내장 데이터 · 즉시 표시</MedicalDetailText>
    </MedicalDetailBody>
  );
}

function ShelterModule({
  active = true,
  locationSnapshot,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: MapModuleBaseProps) {
  const facilitySearch = useFacilitySearchMode({ locationSnapshot });
  const [selectedShelter, setSelectedShelter] = useState<LocalShelterMarker | null>(null);

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

  const { data: listMarkers = [], isFetching, isInitialLoad } = useShelterMarkersQuery(
    searchParams,
    active,
  );

  const handleMarkerPress = (shelter: LocalShelterMarker) => {
    setSelectedShelter(shelter);
  };

  const handleCloseSheet = () => {
    setSelectedShelter(null);
  };

  return (
    <View className="flex-1">
      <View className={MAP_FILTER_BAR_CLASS}>
        <FacilitySearchBarComponent
          facilityLabel="쉼터"
          mode={mode}
          sido={sido}
          sigungu={sigungu}
          gpsLoading={gpsLoading}
          statusLabel={statusLabel}
          resultCount={listMarkers.length}
          onActivateGps={() => void activateGpsSearch()}
          onSidoChange={handleSidoChange}
          onSigunguChange={handleSigunguChange}
        />
        {isFetching && !isInitialLoad && listMarkers.length > 0 ? (
          <ActivityIndicator size="small" color="#64748b" className="mt-2" />
        ) : null}
      </View>

      <MapListFadeIn loading={isInitialLoad} hasData={listMarkers.length > 0}>
        <FlashList
          style={{ flex: 1 }}
          data={listMarkers}
          estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE}
          keyExtractor={(item) => item.id}
          contentContainerStyle={MAP_LIST_CONTENT_STYLE}
          ListEmptyComponent={
            <EmptyState
              message={
                searchParams.textQuery || searchParams.regionFilter
                  ? '해당 조건의 쉼터를 찾을 수 없습니다'
                  : '주변 쉼터를 찾을 수 없습니다'
              }
              hint="시·도 또는 시·군·구를 선택해 보세요"
            />
          }
          renderItem={({ item, index }) => (
            <MedicalFacilityListCard
              variant={index === 0 && mode === 'gps' ? 'aed' : 'default'}
              selected={selectedShelter?.id === item.id}
              onPress={() => handleMarkerPress(item)}
            >
              {index === 0 && mode === 'gps' ? (
                <View className="mb-2 self-start">
                  <MedicalFacilityStatusPill label="최단" tone="er" />
                </View>
              ) : null}
              <MedicalFacilityListTitleRow title={item.name} />
              {item.address?.trim() ? (
                <Text className="mt-1 text-sm text-kemix-text-secondary" numberOfLines={2}>
                  {item.address.trim()}
                </Text>
              ) : null}
              <MedicalFacilityListDistanceRow
                distanceM={item.distanceM}
                walkMin={item.walkMin}
                distanceUnitMode={distanceUnitMode}
                onDistanceUnitModeChange={onDistanceUnitModeChange}
                hint="탭하여 상세 정보 보기"
              />
            </MedicalFacilityListCard>
          )}
        />
      </MapListFadeIn>

      <MapMarkerDetailSheet
        visible={selectedShelter !== null}
        title={selectedShelter?.name || '쉼터'}
        loading={false}
        onClose={handleCloseSheet}
      >
        {selectedShelter ? (
          <ShelterDetailContent
            shelter={selectedShelter}
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

function ShelterDetailContent({
  shelter,
  distanceUnitMode,
  onDistanceUnitToggle,
}: {
  shelter: LocalShelterMarker;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
}) {
  const distanceBlock = (
    <View className="flex-row gap-3">
      <MedicalDetailInfoTile
        icon="navigate"
        label="거리"
        value={formatDistanceMeters(shelter.distanceM ?? 0, distanceUnitMode)}
        onPress={onDistanceUnitToggle}
      />
      <MedicalDetailInfoTile icon="walk" label="도보" value={`${shelter.walkMin ?? 0}분`} />
    </View>
  );

  return (
    <MedicalDetailBody>
      <MedicalDetailLocationHeader
        name={shelter.name}
        address={shelter.address}
        latitude={shelter.latitude}
        longitude={shelter.longitude}
        mapKind="shelter"
        distanceBlock={distanceBlock}
      />
      <MedicalDetailText variant="muted">무더위·한파 쉼터 · 오프라인 데이터</MedicalDetailText>
    </MedicalDetailBody>
  );
}

function filterPediatricHospitals(items: HospitalFinderItem[], query: string): HospitalFinderItem[] {
  const normalized = query.trim().replace(/\s+/g, '').toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => {
    const name = item.name.replace(/\s+/g, '').toLowerCase();
    const address = item.address.replace(/\s+/g, '').toLowerCase();
    return name.includes(normalized) || address.includes(normalized);
  });
}

function PediatricModule({
  active,
  locationSnapshot,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: MapModuleBaseProps & { active: boolean }) {
  const facilitySearch = useFacilitySearchMode({ locationSnapshot });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<HospitalFinderItem | null>(null);

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

  const { data, isFetching, isLoading } = usePediatricHospitalsQuery(searchParams, active);
  const isInitialLoad = isLoading && !(data?.items?.length);

  const hospitals = useMemo(() => {
    const base = data?.items ?? [];
    return filterPediatricHospitals(base, searchQuery);
  }, [data?.items, searchQuery]);

  const handleMarkerPress = (hospital: HospitalFinderItem) => {
    setSelectedHospital(hospital);
  };

  const handleCloseSheet = () => {
    setSelectedHospital(null);
  };

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return `'${searchQuery.trim()}' 검색 결과가 없습니다`;
    }
    if (searchParams.regionFilter) {
      return `${statusLabel} 소아 의료기관을 찾을 수 없습니다`;
    }
    return '주변 소아 의료기관을 찾을 수 없습니다';
  }, [searchParams.regionFilter, searchQuery, statusLabel]);

  return (
    <View className="flex-1">
      <View className={MAP_FILTER_BAR_CLASS}>
        <FacilitySearchBarComponent
          facilityLabel="소아"
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
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="병원 이름·주소 검색"
        />
        {data?.fallbackUsed ? (
          <Text className="mt-2 text-xs text-amber-700">
            선택 지역 결과가 없어 {data.region.label} 전체를 조회했습니다.
          </Text>
        ) : null}
        {data?.localSource ? (
          <Text className="mt-1 text-xs text-kemix-text-secondary">
            로컬 내장 데이터를 우선 표시합니다
            {isFetching ? ' · API 보강 중…' : data.apiEnriched ? ' · API 보강 완료' : ''}
          </Text>
        ) : null}
        {isFetching && !isInitialLoad && hospitals.length > 0 ? (
          <ActivityIndicator size="small" color="#64748b" className="mt-2" />
        ) : null}
      </View>

      <MapListFadeIn loading={isInitialLoad} hasData={hospitals.length > 0}>
        <FlashList
          style={{ flex: 1 }}
          data={hospitals}
          estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE + 48}
          keyExtractor={(item) => item.hpid || `${item.name}-${item.address}`}
          contentContainerStyle={MAP_LIST_CONTENT_STYLE}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              message={emptyMessage}
              hint={
                mode === 'gps'
                  ? '지역을 선택하거나 검색어를 변경해 보세요'
                  : '「현재 위치 기준으로 보기」를 켜거나 시·도를 선택해 보세요'
              }
            />
          }
          renderItem={({ item }) => (
            <PediatricHospitalCard
              hospital={item}
              selected={selectedHospital?.hpid === item.hpid}
              expanded={selectedHospital?.hpid === item.hpid}
              distanceUnitMode={distanceUnitMode}
              onDistanceUnitModeChange={onDistanceUnitModeChange}
              onPress={() => handleMarkerPress(item)}
            />
          )}
        />
      </MapListFadeIn>

      <MapMarkerDetailSheet
        visible={selectedHospital !== null}
        title={selectedHospital?.name || '소아 의료기관'}
        loading={false}
        onClose={handleCloseSheet}
      >
        {selectedHospital ? (
          <PediatricLocalDetailContent
            hospital={selectedHospital}
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

function PharmacyModule({
  active = true,
  locationSnapshot,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: MapModuleBaseProps) {
  const facilitySearch = useFacilitySearchMode({ locationSnapshot });

  const [selectedPlace, setSelectedPlace] = useState<LocalPharmacyMarker | null>(null);
  const [pharmacyListViewMode, setPharmacyListViewMode] = useState<PharmacyListViewMode>('distance');

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

  const { data: markers = [], isFetching, isInitialLoad, isNightHoursLoading, isError } = usePharmacyMarkersQuery(
    searchParams,
    active,
  );

  const displayMarkers = useMemo(() => {
    try {
      const safeMarkers = Array.isArray(markers) ? markers : [];
      return sortPharmaciesForListView(safeMarkers, pharmacyListViewMode);
    } catch (error) {
      if (__DEV__) {
        console.warn('[PharmacyModule] sort failed', error);
      }
      return [];
    }
  }, [markers, pharmacyListViewMode]);

  const handleMarkerPress = (place: LocalPharmacyMarker) => {
    setSelectedPlace(place);
  };

  const handleCloseSheet = () => {
    setSelectedPlace(null);
  };

  return (
    <View className="flex-1">
      <View className={MAP_FILTER_BAR_CLASS}>
        <FacilitySearchBarComponent
          facilityLabel="약국"
          mode={mode}
          sido={sido}
          sigungu={sigungu}
          gpsLoading={gpsLoading}
          statusLabel={statusLabel}
          resultCount={displayMarkers.length}
          onActivateGps={() => void activateGpsSearch()}
          onSidoChange={handleSidoChange}
          onSigunguChange={handleSigunguChange}
          pharmacyListViewMode={pharmacyListViewMode}
          onPharmacyListViewModeChange={setPharmacyListViewMode}
        />
        {isFetching && !isInitialLoad && displayMarkers.length > 0 ? (
          <ActivityIndicator size="small" color="#64748b" className="mt-2" />
        ) : null}
        {isNightHoursLoading && displayMarkers.length > 0 ? (
          <Text className="mt-1 text-xs text-kemix-text-secondary">심야약국 시간 정보 불러오는 중…</Text>
        ) : null}
      </View>

      <MapListFadeIn loading={isInitialLoad} hasData={displayMarkers.length > 0}>
        <FlashList
          style={{ flex: 1 }}
          data={displayMarkers}
          estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE}
          keyExtractor={(item) => item.i}
          contentContainerStyle={MAP_LIST_CONTENT_STYLE}
          ListEmptyComponent={
            <EmptyState
              message={
                isError
                  ? '약국 데이터를 불러오지 못했습니다'
                  : searchParams.regionFilter
                    ? `${statusLabel} 약국을 찾을 수 없습니다`
                    : '주변 약국을 찾을 수 없습니다'
              }
              hint={
                isError
                  ? '잠시 후 다시 시도하거나 다른 지역을 선택해 보세요'
                  : '시·도 또는 시·군·구를 선택해 보세요'
              }
            />
          }
          renderItem={({ item }) => {
            let openStatus: PharmacyOpenStatus;
            let isNightPharmacyToday = false;
            let cardVariant: 'default' | 'pharmacy-night' | 'pharmacy-open' = 'default';
            try {
              openStatus = getPharmacyOpenStatus(item);
              isNightPharmacyToday = isTodayNightPharmacy(item);
              cardVariant = getPharmacyListCardVariant(item, pharmacyListViewMode);
            } catch {
              openStatus = {
                hasHours: false,
                isOpenNow: false,
                dayLabel: '',
                hoursLabel: '',
                start: '',
                end: '',
              };
            }
            return (
              <MedicalFacilityListCard
                selected={selectedPlace?.i === item.i}
                variant={cardVariant}
                onPress={() => handleMarkerPress(item)}
              >
                {isNightPharmacyToday ? (
                  <View className="mb-2">
                    <PharmacyNightPharmacyBadge appearance="list" compact />
                  </View>
                ) : null}
                <MedicalFacilityListTitleRow
                  title={item.n || '약국'}
                  trailing={
                    openStatus.hasHours ? (
                      <PharmacyOpenBadge status={openStatus} compact appearance="list" />
                    ) : null
                  }
                />
                {item.a?.trim() ? (
                  <Text className="mt-1 text-sm text-kemix-text-secondary" numberOfLines={2}>
                    {item.a.trim()}
                  </Text>
                ) : null}
                {openStatus.hasHours ? (
                  <Text className="mt-1 text-xs text-kemix-text-secondary">
                    {openStatus.dayLabel} {openStatus.hoursLabel}
                  </Text>
                ) : (
                  <Text className="mt-1 text-xs text-kemix-muted">심야약국 운영시간 데이터 없음</Text>
                )}
                <MedicalFacilityListDistanceRow
                  distanceM={item.distanceM}
                  walkMin={item.walkMin}
                  distanceUnitMode={distanceUnitMode}
                  onDistanceUnitModeChange={onDistanceUnitModeChange}
                  hint="탭하여 상세 정보 보기"
                />
              </MedicalFacilityListCard>
            );
          }}
        />
      </MapListFadeIn>

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

function ErModule({
  active,
  locationSnapshot,
  distanceUnitMode,
  onDistanceUnitModeChange,
}: MapModuleBaseProps & { active: boolean }) {
  const facilitySearch = useFacilitySearchMode({ locationSnapshot });

  const [selectedPlace, setSelectedPlace] = useState<LocalHospitalMarkerWithLive | null>(null);
  const [metadataIndex, setMetadataIndex] = useState<Map<string, HospitalMetadataEntry> | null>(null);
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

  const { data: baseMarkers = [], isFetching: markersFetching, isInitialLoad } = useFacilityMarkersQuery(
    'hospital',
    searchParams,
    { erOnly: false },
    active,
  );

  const liveApiRegion = useMemo(
    () => resolveErLiveApiRegion(searchParams, locationSnapshot),
    [searchParams, locationSnapshot],
  );

  const allMarkers = useMemo(() => {
    const merged = applyErLiveOverlayToLocal(baseMarkers, null);
    const enriched = enrichErMarkersWithMetadata(merged, metadataIndex);
    return sortErTabHospitals(enriched);
  }, [baseMarkers, metadataIndex]);

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

  const handleMarkerPress = (place: LocalHospitalMarkerWithLive) => {
    setSelectedPlace(place);
  };

  const handleCloseSheet = () => {
    setSelectedPlace(null);
  };

  return (
    <View className="flex-1">
      <View className={MAP_FILTER_BAR_CLASS}>
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
        {markersFetching && !isInitialLoad && allMarkers.length > 0 ? (
          <ActivityIndicator size="small" color="#64748b" className="mt-2" />
        ) : null}
      </View>

      <MapListFadeIn loading={isInitialLoad} hasData={allMarkers.length > 0}>
        <FlashList
          style={{ flex: 1 }}
          data={allMarkers}
          estimatedItemSize={LIST_ESTIMATED_ITEM_SIZE + 40}
          keyExtractor={(item) => item.i}
          contentContainerStyle={MAP_LIST_CONTENT_STYLE}
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
      </MapListFadeIn>

      <MapMarkerDetailSheet
        visible={selectedPlace !== null}
        title={selectedPlace?.n || '응급실'}
        loading={false}
        onClose={handleCloseSheet}
      >
        {selectedPlace ? (
          <ErLocalDetailContent
            place={selectedPlace}
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

  const variant = place.isErPriority
    ? 'er'
    : isMoonlight
      ? 'moonlight'
      : place.isPediatricPriority
        ? 'pediatric'
        : 'default';

  return (
    <MedicalFacilityListCard selected={selected} variant={variant} onPress={onPress}>
      {place.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge compact />
        </View>
      ) : null}
      {place.isErPriority ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="🚨 응급실 운영" tone="er" />
        </View>
      ) : isMoonlight ? (
        <View className="mb-2">
          <MoonlightHospitalBadge compact />
        </View>
      ) : place.isPediatricPriority ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="👶 소아 특화" tone="pediatric" />
        </View>
      ) : null}

      <MedicalFacilityListTitleRow
        title={place.n || '병원'}
        trailing={
          <>
            {place.openStatusLabel !== '확인 필요' ? (
              <MedicalFacilityStatusPill
                label={place.openStatusLabel}
                tone={place.isOpenNow ? 'open' : 'closed'}
              />
            ) : null}
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: `${ER_STATUS_COLORS[status]}18` }}
            >
              <Text className="text-xs font-bold" style={{ color: ER_STATUS_COLORS[status] }}>
                {place.liveSynced ? ER_STATUS_LABELS[status] : '확인중'}
              </Text>
            </View>
          </>
        }
      />

      {place.customMemo ? (
        <Text className="mt-2 text-xs leading-5 text-kemix-text-secondary">{place.customMemo}</Text>
      ) : null}

      {place.specialties && place.specialties.length > 0 ? (
        <View className="mt-2">
          <HospitalSpecialtyTags specialties={place.specialties} maxTags={4} />
        </View>
      ) : null}

      {todaySchedule ? (
        <Text className="mt-2 text-xs text-kemix-text-secondary">
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
      <MedicalFacilityListDistanceRow
        distanceM={place.distanceM}
        walkMin={place.walkMin}
        distanceUnitMode={distanceUnitMode}
        onDistanceUnitModeChange={onDistanceUnitModeChange}
        hint="탭하여 주소·전화·상세 병상 확인"
        trailing={
          place.availablePediatricErBeds > 0 ? (
            <Text className="text-xs font-semibold text-pink-300">
              소아 {place.availablePediatricErBeds}병상
            </Text>
          ) : null
        }
      />
    </MedicalFacilityListCard>
  );
}

function ErLocalDetailContent({
  place,
  liveApiRegion,
  coordinate,
  distanceUnitMode,
  onDistanceUnitToggle,
}: {
  place: LocalHospitalMarkerWithLive;
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
      try {
        const result = await fetchErHospitalFullDetail(place.i, {
          coordinate,
          region: liveApiRegion,
        });

        if (cancelled) return;

        if (result) {
          setDetail(result);
        } else {
          const fallback = getHybridHospitalDetailFromStore(place.i, coordinate, null);
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
      } catch (error) {
        if (cancelled) return;
        setDetailError(
          error instanceof EmergencyApiError
            ? error.message
            : '상세 정보를 불러오지 못했습니다. 아래 기본 정보를 참고해 주세요.',
        );
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
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

  const hospitalName = detail?.hospitalName || place.n || '병원';
  const hospitalAddress = detail?.address?.trim() || place.a?.trim() || '주소 정보 없음';
  const phoneSublabel = erPhone && erPhone === callPhone ? '응급실' : undefined;

  const leadingContent = (
    <>
      {place.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge compact appearance="detail" />
        </View>
      ) : null}
      {place.isErPriority ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="🚨 응급실 운영" tone="er" />
        </View>
      ) : isMoonlight ? (
        <View className="mb-2">
          <MoonlightHospitalBadge compact appearance="detail" />
        </View>
      ) : place.isPediatricPriority ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="👶 소아 특화" tone="pediatric" />
        </View>
      ) : null}
      <ErDutyContactButtons
        specs={hospitalSpecs}
        hospitalName={hospitalName}
        appearance="light"
      />
    </>
  );

  const titleExtras = (
    <>
      {(detail?.emergencyClassName || place.td)?.trim() ? (
        <MedicalDetailText variant="secondary">
          {detail?.emergencyClassName || place.td}
        </MedicalDetailText>
      ) : null}
      {place.sg?.trim() ? <MedicalDetailText variant="muted">{place.sg}</MedicalDetailText> : null}
      {openStatusLabel !== '확인 필요' ? (
        <View
          className="mt-2 self-start rounded-full px-2.5 py-1"
          style={{ backgroundColor: isOpenNow ? '#dcfce7' : MEDICAL_DETAIL.cardMuted }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: isOpenNow ? '#15803d' : MEDICAL_DETAIL.textSecondary,
            }}
          >
            {openStatusLabel}
          </Text>
        </View>
      ) : null}
    </>
  );

  const distanceBlock = (
    <View className="flex-row gap-3">
      <MedicalDetailInfoTile
        icon="navigate"
        label="거리"
        value={formatDistanceMeters(place.distanceM ?? 0, distanceUnitMode)}
        onPress={onDistanceUnitToggle}
      />
      <MedicalDetailInfoTile icon="walk" label="도보" value={`${place.walkMin ?? 0}분`} />
    </View>
  );

  return (
    <MedicalDetailBody>
      {detailLoading ? (
        <View className="mb-3 items-center py-4">
          <ActivityIndicator size="small" color={MEDICAL_DETAIL.textMuted} />
          <MedicalDetailText variant="muted">실시간 병상·기관 정보 불러오는 중...</MedicalDetailText>
        </View>
      ) : null}

      {detailError ? (
        <View className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Text className="text-sm text-amber-800">{detailError}</Text>
        </View>
      ) : null}

      <MedicalDetailLocationHeader
        name={hospitalName}
        address={hospitalAddress}
        latitude={place.lat}
        longitude={place.lng}
        phone={callPhone}
        phoneSublabel={phoneSublabel}
        mapKind="er"
        leadingContent={leadingContent}
        titleExtras={titleExtras}
        distanceBlock={distanceBlock}
      />

      <ErHospitalSpecsPanel
        specs={hospitalSpecs}
        hospitalName={detail?.hospitalName || place.n || '병원'}
        showDutyContacts={false}
        appearance="light"
      />

      {specialties.length > 0 ? (
        <View className="mt-3">
          <MedicalDetailSectionTitle>진료 과목</MedicalDetailSectionTitle>
          <HospitalSpecialtyTags specialties={specialties} maxTags={12} appearance="light" />
        </View>
      ) : null}

      {weeklySchedule.length > 0 ? (
        <View className="mt-4">
          <MedicalDetailSectionTitle>요일별 진료시간</MedicalDetailSectionTitle>
          <HospitalWeeklyHours schedule={weeklySchedule} appearance="light" />
        </View>
      ) : null}

      <View className="mt-4 flex-row items-center justify-between">
        <MedicalDetailText variant="title">응급실 병상</MedicalDetailText>
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
        <MedicalDetailCard>
          <MedicalDetailSectionTitle>가용 병상 현황</MedicalDetailSectionTitle>
          {bedRows.map((row) => (
            <View key={row.label} className="flex-row items-center justify-between py-1">
              <MedicalDetailText variant="secondary">{row.label}</MedicalDetailText>
              <Text style={{ fontSize: 12, fontWeight: '600', color: MEDICAL_DETAIL.text }}>
                {row.value}병상
              </Text>
            </View>
          ))}
        </MedicalDetailCard>
      ) : availablePediatricBeds > 0 ? (
        <View className="mt-2 rounded-lg bg-pink-50 px-3 py-2">
          <Text className="text-xs font-semibold text-pink-700">
            소아 응급 가용 병상: {formatCount(availablePediatricBeds, '0')}병상
          </Text>
        </View>
      ) : null}

      {detail?.onCallDoctor?.trim() ? (
        <MedicalDetailText variant="secondary">당직의: {detail.onCallDoctor}</MedicalDetailText>
      ) : null}

      {detail?.updatedAt ? (
        <MedicalDetailText variant="muted">
          갱신: {formatEmergencyUpdatedAt(detail.updatedAt)}
        </MedicalDetailText>
      ) : null}

      {detail?.description?.trim() ? (
        <MedicalDetailText variant="secondary">{detail.description}</MedicalDetailText>
      ) : null}

      {place.customMemo ? (
        <View className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <Text className="text-xs font-semibold text-amber-800">안내</Text>
          <Text className="mt-1 text-xs leading-5 text-amber-900">{place.customMemo}</Text>
        </View>
      ) : null}
    </MedicalDetailBody>
  );
}
