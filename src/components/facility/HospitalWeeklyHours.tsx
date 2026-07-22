import { Text, View } from 'react-native';
import type { HospitalDutyDay } from '@/utils/hospitalHours';
import { DUTY_DAY_FULL_LABELS, getTreatmentDayCode } from '@/utils/hospitalHours';

type Props = {
  schedule: HospitalDutyDay[];
  compact?: boolean;
};

function formatDayHours(day: HospitalDutyDay): string {
  if (day.closed || (!day.start && !day.end)) return '휴무';
  if (day.start && day.end) return `${day.start} ~ ${day.end}`;
  return day.start || day.end || '시간 미상';
}

export function HospitalWeeklyHours({ schedule, compact = false }: Props) {
  const todayCode = getTreatmentDayCode();

  if (schedule.length === 0) {
    return <Text className="text-xs text-slate-500">운영시간 정보 없음</Text>;
  }

  return (
    <View className="gap-1">
      {schedule.map((day) => {
        const isToday = day.dayCode === todayCode;
        return (
          <View
            key={day.dayCode}
            className={`flex-row items-center justify-between rounded-lg px-2 py-1 ${
              isToday ? 'bg-violet-50' : 'bg-slate-50'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${isToday ? 'text-violet-800' : 'text-slate-600'}`}
            >
              {compact ? day.dayLabel : DUTY_DAY_FULL_LABELS[day.dayCode] ?? day.dayLabel}
            </Text>
            <Text className={`text-xs ${isToday ? 'text-violet-700' : 'text-slate-500'}`}>
              {formatDayHours(day)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
