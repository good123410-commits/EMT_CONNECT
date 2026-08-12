import { Text, View } from 'react-native';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import type { HospitalDutyDay } from '@/utils/hospitalHours';
import { DUTY_DAY_FULL_LABELS, getTreatmentDayCode } from '@/utils/hospitalHours';

type Props = {
  schedule: HospitalDutyDay[];
  compact?: boolean;
  appearance?: 'default' | 'light';
};

function formatDayHours(day: HospitalDutyDay): string {
  if (day.closed || (!day.start && !day.end)) return '휴무';
  if (day.start && day.end) return `${day.start} ~ ${day.end}`;
  if (day.start) return day.start;
  return day.end || '시간 미상';
}

export function HospitalWeeklyHours({ schedule, compact = false, appearance = 'default' }: Props) {
  const todayCode = getTreatmentDayCode();
  const isLight = appearance === 'light';

  if (schedule.length === 0) {
    return (
      <Text
        className={isLight ? undefined : 'text-xs text-kemix-text-secondary'}
        style={isLight ? { fontSize: 12, color: MEDICAL_DETAIL.textSecondary } : undefined}
      >
        운영시간 정보 없음
      </Text>
    );
  }

  return (
    <View className="gap-1">
      {schedule.map((day) => {
        const isToday = day.dayCode === todayCode;
        return (
          <View
            key={day.dayCode}
            className={
              isLight
                ? undefined
                : `flex-row items-center justify-between rounded-lg px-2 py-1 ${
                    isToday ? 'bg-violet-50' : 'bg-kemix-bg'
                  }`
            }
            style={
              isLight
                ? {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: isToday ? '#ede9fe' : MEDICAL_DETAIL.cardMuted,
                  }
                : undefined
            }
          >
            <Text
              className={
                isLight
                  ? undefined
                  : `text-xs font-semibold ${isToday ? 'text-violet-800' : 'text-kemix-text-secondary'}`
              }
              style={
                isLight
                  ? {
                      fontSize: 12,
                      fontWeight: '600',
                      color: isToday ? '#5b21b6' : MEDICAL_DETAIL.textSecondary,
                    }
                  : undefined
              }
            >
              {compact ? day.dayLabel : DUTY_DAY_FULL_LABELS[day.dayCode] ?? day.dayLabel}
            </Text>
            <Text
              className={
                isLight ? undefined : `text-xs ${isToday ? 'text-violet-700' : 'text-kemix-text-secondary'}`
              }
              style={
                isLight
                  ? { fontSize: 12, color: isToday ? '#6d28d9' : MEDICAL_DETAIL.textSecondary }
                  : undefined
              }
            >
              {formatDayHours(day)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
