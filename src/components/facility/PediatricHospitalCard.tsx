import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { DistanceText } from '@/components/map/DistanceText';
import { HospitalSpecialtyTags } from '@/components/facility/HospitalSpecialtyTags';
import { HospitalWeeklyHours } from '@/components/facility/HospitalWeeklyHours';
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

  const borderClass = hospital.isMoonlightHospital
    ? selected
      ? 'border-indigo-400 bg-indigo-50'
      : 'border-indigo-200'
    : selected
      ? 'border-pink-400 bg-pink-50'
      : 'border-slate-200';

  return (
    <Pressable className={`mb-3 rounded-2xl border bg-white p-4 ${borderClass}`} onPress={onPress}>
      {hospital.isMoonlightHospital ? (
        <View className="mb-2">
          <MoonlightHospitalBadge />
        </View>
      ) : hospital.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge />
        </View>
      ) : hospital.isPediatricCenter ? (
        <View className="mb-2 self-start rounded-full bg-pink-100 px-2.5 py-1">
          <Text className="text-xs font-bold text-pink-700">👶 소아 진료</Text>
        </View>
      ) : null}

      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-bold text-slate-900">{hospital.name}</Text>
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

      <Text className="mt-1 text-sm text-slate-600">{hospital.address}</Text>
      {hospital.customMemo ? (
        <Text className="mt-1 text-xs leading-5 text-amber-800">{hospital.customMemo}</Text>
      ) : null}
      <Text className="mt-0.5 text-xs text-slate-500">
        {hospital.facilityType}
        {hospital.phone !== '-' ? ` · ${hospital.phone}` : ''}
      </Text>

      <View className="mt-3">
        <HospitalSpecialtyTags specialties={hospital.specialties} maxTags={expanded ? 12 : 4} />
      </View>

      {expanded ? (
        <View className="mt-3">
          <Text className="mb-2 text-xs font-bold text-slate-700">요일별 진료시간</Text>
          <HospitalWeeklyHours schedule={hospital.weeklySchedule} />
        </View>
      ) : todaySchedule ? (
        <Text className="mt-2 text-xs text-slate-500">
          오늘:{' '}
          {todaySchedule.closed || (!todaySchedule.start && !todaySchedule.end)
            ? '휴무'
            : `${todaySchedule.start} ~ ${todaySchedule.end}`}
        </Text>
      ) : null}

      {hospital.distanceM > 0 ? (
        <View className="mt-3 flex-row items-center">
          <Ionicons name="walk-outline" size={14} color="#64748b" />
          <DistanceText
            distanceM={hospital.distanceM}
            walkMin={hospital.walkMin}
            unitMode={distanceUnitMode}
            onUnitModeChange={onDistanceUnitModeChange}
            textStyle={{ fontSize: 14, color: '#475569', marginLeft: 4 }}
          />
        </View>
      ) : null}
    </Pressable>
  );
}
