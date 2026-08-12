import { View } from 'react-native';
import { HospitalSpecialtyTags } from '@/components/facility/HospitalSpecialtyTags';
import { HospitalWeeklyHours } from '@/components/facility/HospitalWeeklyHours';
import { MoonlightHoursTable } from '@/components/facility/MoonlightHoursTable';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import { PartnerHospitalBadge } from '@/components/facility/PartnerHospitalBadge';
import {
  MedicalFacilityStatusPill,
} from '@/components/facility/MedicalFacilityListCard';
import {
  MedicalDetailBody,
  MedicalDetailInfoTile,
  MedicalDetailLocationHeader,
  MedicalDetailSectionTitle,
  MedicalDetailText,
} from '@/components/map/MedicalDetailPrimitives';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import type { HospitalFinderItem } from '@/services/hospitalFinderService';
import type { DistanceUnitMode } from '@/utils/formatDistance';
import { formatDistanceMeters } from '@/utils/formatDistance';

type PediatricLocalDetailContentProps = {
  hospital: HospitalFinderItem;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
};

export function PediatricLocalDetailContent({
  hospital,
  distanceUnitMode,
  onDistanceUnitToggle,
}: PediatricLocalDetailContentProps) {
  const phone = hospital.phone?.trim();

  const leadingContent = (
    <>
      {hospital.isMoonlightHospital ? (
        <View className="mb-2">
          <MoonlightHospitalBadge appearance="detail" />
        </View>
      ) : hospital.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge compact appearance="detail" />
        </View>
      ) : hospital.isPediatricCenter ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="👶 소아 진료" tone="pediatric" />
        </View>
      ) : null}
    </>
  );

  const titleExtras = (
    <>
      <MedicalDetailText variant="secondary">{hospital.facilityType}</MedicalDetailText>
      <View
        className="mt-2 self-start rounded-full px-2.5 py-1"
        style={{ backgroundColor: hospital.isOpenNow ? '#dcfce7' : MEDICAL_DETAIL.cardMuted }}
      >
        <MedicalDetailText variant="muted">{hospital.openStatusLabel}</MedicalDetailText>
      </View>
    </>
  );

  const distanceBlock = (
    <View className="flex-row gap-3">
      <MedicalDetailInfoTile
        icon="navigate"
        label="거리"
        value={formatDistanceMeters(hospital.distanceM ?? 0, distanceUnitMode)}
        onPress={onDistanceUnitToggle}
      />
      <MedicalDetailInfoTile icon="walk" label="도보" value={`${hospital.walkMin ?? 0}분`} />
    </View>
  );

  return (
    <MedicalDetailBody>
      <MedicalDetailLocationHeader
        name={hospital.name}
        address={hospital.address}
        latitude={hospital.latitude}
        longitude={hospital.longitude}
        phone={phone}
        mapKind="pediatric"
        leadingContent={leadingContent}
        titleExtras={titleExtras}
        distanceBlock={distanceBlock}
      />

      {hospital.specialties.length > 0 ? (
        <View className="mt-1">
          <MedicalDetailSectionTitle>진료 과목</MedicalDetailSectionTitle>
          <HospitalSpecialtyTags specialties={hospital.specialties} maxTags={12} appearance="light" />
        </View>
      ) : null}

      {hospital.localOperatingHours ? (
        <View className="mt-4">
          <MedicalDetailSectionTitle>요일별 진료시간</MedicalDetailSectionTitle>
          <MoonlightHoursTable operatingHours={hospital.localOperatingHours} appearance="light" />
        </View>
      ) : hospital.weeklySchedule.length > 0 ? (
        <View className="mt-4">
          <MedicalDetailSectionTitle>요일별 진료시간</MedicalDetailSectionTitle>
          <HospitalWeeklyHours schedule={hospital.weeklySchedule} appearance="light" />
        </View>
      ) : null}

      {hospital.customMemo ? (
        <View className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <MedicalDetailText variant="secondary">{hospital.customMemo}</MedicalDetailText>
        </View>
      ) : null}

      {hospital.description?.trim() ? (
        <MedicalDetailText variant="secondary">{hospital.description}</MedicalDetailText>
      ) : null}

      <MedicalDetailText variant="muted">
        {hospital.isLocalBundled ? '로컬 내장 데이터 · ' : hospital.isCustomRecord ? '관리자 등록 · ' : ''}
        방문 전 전화로 진료 가능 여부를 확인해 주세요
      </MedicalDetailText>
    </MedicalDetailBody>
  );
}
