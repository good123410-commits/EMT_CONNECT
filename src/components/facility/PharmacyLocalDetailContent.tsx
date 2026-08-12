import { View } from 'react-native';
import { PharmacyNightPharmacyBadge } from '@/components/facility/PharmacyNightPharmacyBadge';
import { PharmacyOpenBadge } from '@/components/map/PharmacyOpenBadge';
import { PharmacyWeeklyHoursTable } from '@/components/facility/PharmacyWeeklyHoursTable';
import {
  MedicalDetailBody,
  MedicalDetailInfoTile,
  MedicalDetailLocationHeader,
  MedicalDetailSectionTitle,
  MedicalDetailText,
} from '@/components/map/MedicalDetailPrimitives';
import type { LocalPharmacyMarker } from '@/types/localFacility';
import type { DistanceUnitMode } from '@/utils/formatDistance';
import { formatDistanceMeters } from '@/utils/formatDistance';
import { getPharmacyOpenStatus, isTodayNightPharmacy } from '@/utils/pharmacyHours';

type PharmacyLocalDetailContentProps = {
  place: LocalPharmacyMarker;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
};

export function PharmacyLocalDetailContent({
  place,
  distanceUnitMode,
  onDistanceUnitToggle,
}: PharmacyLocalDetailContentProps) {
  const openStatus = getPharmacyOpenStatus(place);
  const isNightPharmacyToday = isTodayNightPharmacy(place);
  const phone = place.p?.trim();

  const titleExtras = (
    <View className="mt-2 gap-2">
      {isNightPharmacyToday ? (
        <PharmacyNightPharmacyBadge appearance="detail" />
      ) : null}
      {openStatus.hasHours ? (
        <>
          <PharmacyOpenBadge status={openStatus} appearance="detail" />
          <MedicalDetailText variant="secondary">
            오늘({openStatus.dayLabel}) 심야 운영: {openStatus.hoursLabel}
          </MedicalDetailText>
        </>
      ) : (
        <MedicalDetailText variant="muted">오늘 심야약국 운영시간 데이터 없음</MedicalDetailText>
      )}
    </View>
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
      <MedicalDetailLocationHeader
        name={place.n || '약국'}
        address={place.a}
        latitude={place.lat}
        longitude={place.lng}
        phone={phone}
        mapKind="pharmacy"
        titleExtras={titleExtras}
        distanceBlock={distanceBlock}
      />

      <View className="mt-4">
        <MedicalDetailSectionTitle>요일별 심야 운영시간</MedicalDetailSectionTitle>
        <PharmacyWeeklyHoursTable weeklyHours={place.wh} appearance="light" />
      </View>

      <MedicalDetailText variant="muted">
        E-Gen 심야약국 데이터 · 방문 전 전화로 운영 여부를 확인해 주세요
      </MedicalDetailText>
    </MedicalDetailBody>
  );
}
