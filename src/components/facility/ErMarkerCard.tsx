import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { ErBedAvailabilitySection } from '@/components/facility/ErBedAvailabilitySection';
import { ErBedErrorBoundary } from '@/components/facility/ErBedErrorBoundary';
import { ErHospitalSpecsPanel } from '@/components/facility/ErHospitalSpecsPanel';
import {
  MedicalFacilityListCard,
  MedicalFacilityListDistanceRow,
  MedicalFacilityListTitleRow,
  MedicalFacilityStatusPill,
} from '@/components/facility/MedicalFacilityListCard';
import { PartnerHospitalBadge } from '@/components/facility/PartnerHospitalBadge';
import { HospitalSpecialtyTags } from '@/components/facility/HospitalSpecialtyTags';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import { useErBedInfo } from '@/hooks/useErBedInfo';
import {
  isMoonlightChildrenHospital,
} from '@/services/emergencyApi';
import { getHospitalErOverride } from '@/services/customHospitalService';
import type { LocalHospitalMarkerWithLive } from '@/services/hybridErService';
import type { LocationRegion } from '@/services/locationService';
import type { DistanceUnitMode } from '@/utils/formatDistance';
import { getTreatmentDayCode } from '@/utils/hospitalHours';
import { mergeSpecsWithErOverride } from '@/utils/hospitalEquipmentOverride';

export type ErMarkerCardProps = {
  place: LocalHospitalMarkerWithLive;
  selected: boolean;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitModeChange: (mode: DistanceUnitMode) => void;
  onPress: () => void;
  liveApiRegion: LocationRegion;
  bedFetchEnabled: boolean;
};

function ErMarkerCardInner({
  place,
  selected,
  distanceUnitMode,
  onDistanceUnitModeChange,
  onPress,
  liveApiRegion,
  bedFetchEnabled,
}: ErMarkerCardProps) {
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

  const { availability, loading, error, hasFetched, snapshot } = useErBedInfo({
    hpid: place.i,
    hospitalName: place.n,
    region: liveApiRegion,
    enabled: bedFetchEnabled,
  });

  const specs = useMemo(() => {
    const base = snapshot?.specs ?? place.specs;
    return mergeSpecsWithErOverride(base, getHospitalErOverride(place.i));
  }, [snapshot?.specs, place.specs, place.i]);

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
          place.openStatusLabel !== '확인 필요' ? (
            <MedicalFacilityStatusPill
              label={place.openStatusLabel}
              tone={place.isOpenNow ? 'open' : 'closed'}
            />
          ) : null
        }
      />

      {place.customMemo ? (
        <Text className="mt-2 text-xs leading-5 text-kemix-text-secondary">{place.customMemo}</Text>
      ) : null}

      {place.a?.trim() ? (
        <Text className="mt-1 text-xs text-kemix-text-muted" numberOfLines={1}>
          {place.a}
        </Text>
      ) : null}

      {place.p?.trim() ? (
        <Text className="mt-0.5 text-xs text-kemix-text-secondary">{place.p}</Text>
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
        <ErBedErrorBoundary compact>
          <ErBedAvailabilitySection
            availability={availability}
            loading={loading}
            error={error}
            hasFetched={hasFetched}
            compact
            showStatusPill
          />
        </ErBedErrorBoundary>
      </View>

      {specs ? (
        <ErHospitalSpecsPanel specs={specs} hospitalName={place.n || '병원'} compact />
      ) : null}

      <MedicalFacilityListDistanceRow
        distanceM={place.distanceM}
        walkMin={place.walkMin}
        distanceUnitMode={distanceUnitMode}
        onDistanceUnitModeChange={onDistanceUnitModeChange}
        hint="탭하여 상세 병상·기관 정보 확인"
        trailing={
          availability.availablePediatricErBeds > 0 ? (
            <Text className="text-xs font-semibold text-pink-300">
              소아 {availability.availablePediatricErBeds}병상
            </Text>
          ) : null
        }
      />
    </MedicalFacilityListCard>
  );
}

export const ErMarkerCard = memo(ErMarkerCardInner);
