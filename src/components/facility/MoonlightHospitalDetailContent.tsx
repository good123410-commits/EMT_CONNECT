import { View } from 'react-native';
import { MoonlightHoursTable } from '@/components/facility/MoonlightHoursTable';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import {
  MedicalDetailBody,
  MedicalDetailLocationHeader,
  MedicalDetailSectionTitle,
  MedicalDetailText,
} from '@/components/map/MedicalDetailPrimitives';
import type { MoonlightHospital } from '@/types/moonlightHospital';

type Props = {
  hospital: MoonlightHospital;
};

export function MoonlightHospitalDetailContent({ hospital }: Props) {
  const phone = hospital.phone?.trim();

  return (
    <MedicalDetailBody>
      <MedicalDetailLocationHeader
        name={hospital.displayName}
        address={hospital.address}
        phone={phone}
        mapKind="pediatric"
        leadingContent={
          <View className="mb-2">
            <MoonlightHospitalBadge appearance="detail" />
          </View>
        }
      />

      <View className="mt-1">
        <MedicalDetailSectionTitle>요일별 진료시간</MedicalDetailSectionTitle>
        <MoonlightHoursTable operatingHours={hospital.operatingHours} appearance="light" />
      </View>

      <MedicalDetailText variant="muted">
        로컬 내장 데이터 · 방문 전 전화로 진료 가능 여부를 확인해 주세요
      </MedicalDetailText>
    </MedicalDetailBody>
  );
}
