import { Text, View } from 'react-native';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import {
  MOONLIGHT_DAY_ORDER,
  type MoonlightDayLabel,
  type MoonlightOperatingHours,
} from '@/types/moonlightHospital';

type Props = {
  operatingHours: MoonlightOperatingHours;
  appearance?: 'default' | 'light';
};

function getTodayLabel(): MoonlightDayLabel {
  const day = new Date().getDay();
  switch (day) {
    case 0:
      return '일요일';
    case 1:
      return '월요일';
    case 2:
      return '화요일';
    case 3:
      return '수요일';
    case 4:
      return '목요일';
    case 5:
      return '금요일';
    case 6:
      return '토요일';
    default: {
      const _exhaustive: never = day;
      return _exhaustive;
    }
  }
}

function formatHours(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return '시간 미상';
  if (trimmed.includes('휴무')) return '휴무';
  return trimmed;
}

export function MoonlightHoursTable({ operatingHours, appearance = 'default' }: Props) {
  const todayLabel = getTodayLabel();
  const isLight = appearance === 'light';

  const rows = MOONLIGHT_DAY_ORDER.map((dayLabel) => ({
    dayLabel,
    hours: formatHours(operatingHours[dayLabel]),
    isToday: dayLabel === todayLabel,
  }));

  if (rows.every((row) => row.hours === '시간 미상')) {
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
    <View
      style={{
        borderWidth: 1,
        borderColor: isLight ? MEDICAL_DETAIL.border : '#e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: isLight ? MEDICAL_DETAIL.cardMuted : '#f1f5f9',
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: '700',
            color: isLight ? MEDICAL_DETAIL.textSecondary : '#64748b',
          }}
        >
          요일
        </Text>
        <Text
          style={{
            flex: 2,
            fontSize: 11,
            fontWeight: '700',
            color: isLight ? MEDICAL_DETAIL.textSecondary : '#64748b',
          }}
        >
          진료시간
        </Text>
      </View>

      {rows.map((row, index) => (
        <View
          key={row.dayLabel}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: row.isToday
              ? isLight
                ? '#ede9fe'
                : '#f5f3ff'
              : isLight
                ? MEDICAL_DETAIL.background
                : '#ffffff',
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: isLight ? MEDICAL_DETAIL.border : '#e2e8f0',
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: row.isToday ? '700' : '600',
              color: row.isToday ? '#5b21b6' : isLight ? MEDICAL_DETAIL.text : '#334155',
            }}
          >
            {row.dayLabel}
          </Text>
          <Text
            style={{
              flex: 2,
              fontSize: 13,
              color: row.isToday ? '#4c1d95' : isLight ? MEDICAL_DETAIL.textSecondary : '#475569',
            }}
          >
            {row.hours}
          </Text>
        </View>
      ))}
    </View>
  );
}
