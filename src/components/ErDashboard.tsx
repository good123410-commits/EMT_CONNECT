import { memo } from 'react';
import { Text, View } from 'react-native';
import type { ErStatus } from '@/mockData/aedAndEmergency';
import { useErBedStatusPalette } from '@/constants/erBedTheme';
import { safeErStatus } from '@/services/emergencyApi';

type BedBarProps = {
  available: number;
  status: ErStatus;
  fillPercent?: number;
  statusColor?: string;
  compact?: boolean;
};

export const BedAvailabilityBar = memo(function BedAvailabilityBar({
  available,
  status,
  fillPercent: fillPercentProp,
  statusColor: statusColorProp,
  compact = false,
}: BedBarProps) {
  const palette = useErBedStatusPalette();
  const safeAvailable = Number.isFinite(available) ? available : 0;
  const safeStatus = safeErStatus(status);
  const statusColor = statusColorProp ?? palette[safeStatus];
  const fillPercent =
    fillPercentProp ??
    (safeStatus === 'full'
      ? 100
      : safeStatus === 'congested'
        ? 72
        : Math.min(safeAvailable * 12, 100));

  return (
    <View>
      <View className="mb-1 flex-row justify-between">
        <Text className={`${compact ? 'text-[11px]' : 'text-xs'} text-kemix-text-secondary`}>
          응급실 가용 병상
        </Text>
        <Text
          className={`${compact ? 'text-[11px]' : 'text-xs'} font-semibold text-kemix-text`}
          style={safeAvailable <= 0 && safeStatus !== 'full' ? { color: palette.empty } : undefined}
        >
          {safeAvailable > 0 ? `${safeAvailable}병상` : safeStatus === 'full' ? '0병상' : '-'}
        </Text>
      </View>
      <View
        className="overflow-hidden rounded-full bg-kemix-elevated"
        style={{ height: compact ? 6 : 8 }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${fillPercent}%`, backgroundColor: statusColor }}
        />
      </View>
    </View>
  );
});
