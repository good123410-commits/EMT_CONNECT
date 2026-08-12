import { Text, View } from 'react-native';
import {
  MedicalFacilityListCard,
  MedicalFacilityListTitleRow,
} from '@/components/facility/MedicalFacilityListCard';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import type { MoonlightHospital } from '@/types/moonlightHospital';
import { MOONLIGHT_DAY_ORDER } from '@/types/moonlightHospital';
type Props = {
  hospital: MoonlightHospital;
  selected?: boolean;
  onPress: () => void;
};

function getTodayHoursLabel(operatingHours: MoonlightHospital['operatingHours']): string | null {
  const day = new Date().getDay();
  const dayLabel = MOONLIGHT_DAY_ORDER[day === 0 ? 6 : day - 1];
  const hours = operatingHours[dayLabel]?.trim();
  if (!hours) return null;
  return `오늘(${dayLabel.replace('요일', '')}): ${hours}`;
}

export function MoonlightHospitalCard({ hospital, selected = false, onPress }: Props) {
  const todayHours = getTodayHoursLabel(hospital.operatingHours);

  return (
    <MedicalFacilityListCard selected={selected} variant="moonlight" onPress={onPress}>
      <View className="mb-2">
        <MoonlightHospitalBadge />
      </View>

      <MedicalFacilityListTitleRow title={hospital.displayName} />

      <Text className="mt-1 text-sm text-kemix-text-secondary">{hospital.address}</Text>
      {hospital.phone ? (
        <Text className="mt-0.5 text-xs text-kemix-text-secondary">{hospital.phone}</Text>
      ) : null}
      {todayHours ? (
        <Text className="mt-2 text-xs text-indigo-700">{todayHours}</Text>
      ) : null}
    </MedicalFacilityListCard>
  );
}
