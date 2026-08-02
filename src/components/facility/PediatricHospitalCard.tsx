import { Text, View } from 'react-native';
import { HospitalSpecialtyTags } from '@/components/facility/HospitalSpecialtyTags';
import { HospitalWeeklyHours } from '@/components/facility/HospitalWeeklyHours';
import {
  MedicalFacilityListCard,
  MedicalFacilityListDistanceRow,
  MedicalFacilityListTitleRow,
  MedicalFacilityStatusPill,
} from '@/components/facility/MedicalFacilityListCard';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import { PartnerHospitalBadge } from '@/components/facility/PartnerHospitalBadge';
import type { HospitalFinderItem } from '@/services/hospitalFinderService';
import type { DistanceUnitMode } from '@/utils/formatDistance';
import { getTreatmentDayCode } from '@/utils/hospitalHours';

type Props = {
  hospital: HospitalFinderItem;
  selected?: boolean;
  expanded?: boolean;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitModeChange: (mode: DistanceUnitMode) => void;
  onPress: () => void;
};

export function PediatricHospitalCard({
  hospital,
  selected = false,
  expanded = false,
  distanceUnitMode,
  onDistanceUnitModeChange,
  onPress,
}: Props) {
  const todayCode = getTreatmentDayCode();
  const todaySchedule = hospital.weeklySchedule.find((day) => day.dayCode === todayCode) ?? null;
  const variant = hospital.isMoonlightHospital
    ? 'moonlight'
    : hospital.isPediatricCenter
      ? 'pediatric'
      : 'default';

  return (
    <MedicalFacilityListCard selected={selected} variant={variant} onPress={onPress}>
      {hospital.isMoonlightHospital ? (
        <View className="mb-2">
          <MoonlightHospitalBadge />
        </View>
      ) : hospital.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge />
        </View>
      ) : hospital.isPediatricCenter ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="👶 소아 진료" tone="pediatric" />
        </View>
      ) : null}

      <MedicalFacilityListTitleRow
        title={hospital.name}
        trailing={
          <MedicalFacilityStatusPill
            label={hospital.openStatusLabel}
            tone={hospital.isOpenNow ? 'open' : 'closed'}
          />
        }
      />

      <Text className="mt-1 text-sm text-kemix-text-secondary">{hospital.address}</Text>
      {hospital.customMemo ? (
        <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">{hospital.customMemo}</Text>
      ) : null}
      <Text className="mt-0.5 text-xs text-kemix-text-secondary">
        {hospital.facilityType}
        {hospital.phone !== '-' ? ` · ${hospital.phone}` : ''}
      </Text>

      <View className="mt-3">
        <HospitalSpecialtyTags specialties={hospital.specialties} maxTags={expanded ? 12 : 4} />
      </View>

      {expanded ? (
        <View className="mt-3">
          <Text className="mb-2 text-xs font-bold text-kemix-text">요일별 진료시간</Text>
          <HospitalWeeklyHours schedule={hospital.weeklySchedule} />
        </View>
      ) : todaySchedule ? (
        <Text className="mt-2 text-xs text-kemix-text-secondary">
          오늘:{' '}
          {todaySchedule.closed || (!todaySchedule.start && !todaySchedule.end)
            ? '휴무'
            : `${todaySchedule.start} ~ ${todaySchedule.end}`}
        </Text>
      ) : null}

      {hospital.distanceM > 0 ? (
        <MedicalFacilityListDistanceRow
          distanceM={hospital.distanceM}
          walkMin={hospital.walkMin}
          distanceUnitMode={distanceUnitMode}
          onDistanceUnitModeChange={onDistanceUnitModeChange}
        />
      ) : null}
    </MedicalFacilityListCard>
  );
}
