import { Text, View } from 'react-native';
import type { ErStatus } from '@/mockData/aedAndEmergency';
import { ER_STATUS_COLORS, ER_STATUS_LABELS } from '@/mockData/aedAndEmergency';
import { safeErStatus } from '@/services/emergencyApi';

type ErDashboardProps = {
  regionLabel: string;
  totalHospitals: number;
  totalAvailableBeds: number;
  availableCount: number;
  congestedCount: number;
  fullCount: number;
  loading?: boolean;
  unavailable?: boolean;
};

function formatDashboardValue(value: number, loading?: boolean, unavailable?: boolean): string {
  if (loading || unavailable) return '—';
  if (!Number.isFinite(value)) return '0';
  return String(value);
}

export function ErDashboardSummary({
  regionLabel,
  totalHospitals,
  totalAvailableBeds,
  availableCount,
  congestedCount,
  fullCount,
  loading = false,
  unavailable = false,
}: ErDashboardProps) {
  const stressedCount = congestedCount + fullCount;
  const statusHint = loading
    ? '정보 확인 중...'
    : unavailable
      ? '실시간 정보를 불러오지 못했습니다'
      : '국립중앙의료원 API';

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <Text className="text-base font-bold text-slate-900">실시간 응급실 가동 현황</Text>
      <Text className="mt-1 text-xs text-slate-500">{regionLabel} · {statusHint}</Text>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-xl bg-slate-50 p-3">
          <Text className="text-2xl font-bold text-slate-900">
            {formatDashboardValue(totalAvailableBeds, loading, unavailable)}
          </Text>
          <Text className="text-xs text-slate-500">가용 병상</Text>
        </View>
        <View className="flex-1 rounded-xl bg-slate-50 p-3">
          <Text className="text-2xl font-bold text-slate-900">
            {formatDashboardValue(stressedCount, loading, unavailable)}
          </Text>
          <Text className="text-xs text-slate-500">혼잡·포화</Text>
        </View>
        <View className="flex-1 rounded-xl bg-slate-50 p-3">
          <Text className="text-2xl font-bold text-slate-900">
            {formatDashboardValue(totalHospitals ?? 0, loading, unavailable)}
          </Text>
          <Text className="text-xs text-slate-500">조회 병원</Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <StatusChip status="available" count={availableCount ?? 0} loading={loading} unavailable={unavailable} />
        <StatusChip status="congested" count={congestedCount ?? 0} loading={loading} unavailable={unavailable} />
        <StatusChip status="full" count={fullCount ?? 0} loading={loading} unavailable={unavailable} />
      </View>
    </View>
  );
}

function StatusChip({
  status,
  count,
  loading,
  unavailable,
}: {
  status: ErStatus;
  count: number;
  loading?: boolean;
  unavailable?: boolean;
}) {
  const label = loading || unavailable ? '—' : count;
  return (
    <View
      className="flex-1 flex-row items-center justify-center rounded-lg py-2"
      style={{ backgroundColor: `${ER_STATUS_COLORS[status]}18` }}
    >
      <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: ER_STATUS_COLORS[status] }} />
      <Text className="text-xs font-semibold" style={{ color: ER_STATUS_COLORS[status] }}>
        {ER_STATUS_LABELS[status]} {label}
      </Text>
    </View>
  );
}

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
        <Text className="text-xs text-slate-500">응급실 가용 병상</Text>
        <Text className="text-xs font-semibold text-slate-700">
          {safeAvailable > 0 ? `${safeAvailable}병상` : '-'}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-slate-100">
        <View
          className="h-full rounded-full"
          style={{ width: `${fillPercent}%`, backgroundColor: ER_STATUS_COLORS[safeStatus] }}
        />
      </View>
    </View>
  );
}
