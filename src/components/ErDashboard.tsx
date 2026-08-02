import { Text, View } from 'react-native';
import type { ErStatus } from '@/mockData/aedAndEmergency';
import { ER_STATUS_COLORS } from '@/mockData/aedAndEmergency';
import { safeErStatus } from '@/services/emergencyApi';

type BedBarProps = {
  available: number;
  status: ErStatus;
};

export function BedAvailabilityBar({ available, status }: BedBarProps) {
  const safeAvailable = Number.isFinite(available) ? available : 0;
  const safeStatus = safeErStatus(status);
  const fillPercent =
    safeStatus === 'full'
      ? 100
      : safeStatus === 'congested'
        ? 72
        : Math.min(safeAvailable * 12, 100);

  return (
    <View>
      <View className="mb-1 flex-row justify-between">
        <Text className="text-xs text-kemix-text-secondary">응급실 가용 병상</Text>
        <Text className="text-xs font-semibold text-kemix-text">
          {safeAvailable > 0 ? `${safeAvailable}병상` : '-'}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-kemix-elevated">
        <View
          className="h-full rounded-full"
          style={{ width: `${fillPercent}%`, backgroundColor: ER_STATUS_COLORS[safeStatus] }}
        />
      </View>
    </View>
  );
}
