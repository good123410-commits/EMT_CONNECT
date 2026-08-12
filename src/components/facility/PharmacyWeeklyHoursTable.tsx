import { Text, View } from 'react-native';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import { buildPharmacyWeeklyRows } from '@/utils/pharmacyHours';

type PharmacyWeeklyHoursTableProps = {
  weeklyHours: string[] | undefined;
  appearance?: 'default' | 'light';
};

function formatHours(value: string): string {
  if (!value?.trim() || value.includes('휴무')) return '휴무';
  return value.trim();
}

export function PharmacyWeeklyHoursTable({
  weeklyHours,
  appearance = 'default',
}: PharmacyWeeklyHoursTableProps) {
  const isLight = appearance === 'light';
  const rows = buildPharmacyWeeklyRows(weeklyHours).map((row) => ({
    ...row,
    hours: formatHours(row.hours),
  }));

  if (!weeklyHours?.some((value) => value?.trim())) {
    return (
      <Text
        className={isLight ? undefined : 'text-xs text-kemix-text-secondary'}
        style={isLight ? { fontSize: 12, color: MEDICAL_DETAIL.textSecondary } : undefined}
      >
        심야약국 운영시간 데이터 없음
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
          심야 운영시간
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
                ? '#dbeafe'
                : '#eff6ff'
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
              color: row.isToday ? '#1d4ed8' : isLight ? MEDICAL_DETAIL.text : '#334155',
            }}
          >
            {row.dayLabel}
          </Text>
          <Text
            style={{
              flex: 2,
              fontSize: 13,
              color: row.isToday ? '#1e40af' : isLight ? MEDICAL_DETAIL.textSecondary : '#475569',
            }}
          >
            {row.hours}
          </Text>
        </View>
      ))}
    </View>
  );
}
