import { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { BedAvailabilityBar } from '@/components/ErDashboard';
import { ErBedSkeleton } from '@/components/facility/ErBedSkeleton';
import { useErBedStatusPalette } from '@/constants/erBedTheme';
import { ER_STATUS_LABELS } from '@/mockData/aedAndEmergency';
import type { ErBedAvailability } from '@/utils/erBedAvailability';

type ErBedAvailabilitySectionProps = {
  availability: ErBedAvailability;
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  compact?: boolean;
  showStatusPill?: boolean;
  pediatricBeds?: number;
};

function ErBedAvailabilitySectionInner({
  availability,
  loading,
  error,
  hasFetched,
  compact = false,
  showStatusPill = true,
  pediatricBeds,
}: ErBedAvailabilitySectionProps) {
  const palette = useErBedStatusPalette();

  const statusColor = useMemo(() => {
    if (!hasFetched || loading) return palette.unavailable;
    if (error) return palette.unavailable;
    if (availability.isEmpty && availability.hasLiveData) return palette.full;
    return palette[availability.status];
  }, [availability, error, hasFetched, loading, palette]);

  if (loading && !hasFetched) {
    return <ErBedSkeleton compact={compact} />;
  }

  if (error && hasFetched) {
    return (
      <View
        className="rounded-xl border border-kemix-border bg-kemix-surface-elevated"
        style={{ padding: compact ? 10 : 12 }}
      >
        <Text className="text-xs font-medium text-kemix-text-secondary">
          현재 실시간 정보 조회 불가
        </Text>
        <Text className="mt-1 text-[11px] leading-4 text-kemix-text-muted">{error}</Text>
      </View>
    );
  }

  if (!hasFetched) {
    return (
      <Text className="text-xs text-kemix-text-muted">
        스크롤 시 실시간 병상 정보를 불러옵니다
      </Text>
    );
  }

  return (
    <View>
      {showStatusPill ? (
        <View className="mb-2 flex-row items-center justify-end">
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: `${statusColor}18` }}
          >
            <Text className="text-xs font-bold" style={{ color: statusColor }}>
              {availability.hasLiveData ? ER_STATUS_LABELS[availability.status] : '확인중'}
            </Text>
          </View>
        </View>
      ) : null}
      <BedAvailabilityBar
        available={availability.availableErBeds}
        status={availability.status}
        fillPercent={availability.fillPercent}
        statusColor={statusColor}
        compact={compact}
      />
      {pediatricBeds && pediatricBeds > 0 ? (
        <Text className="mt-2 text-xs font-semibold text-pink-400">
          소아 {pediatricBeds}병상
        </Text>
      ) : null}
    </View>
  );
}

export const ErBedAvailabilitySection = memo(ErBedAvailabilitySectionInner);
