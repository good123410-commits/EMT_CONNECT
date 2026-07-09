import { Text, View } from 'react-native';
import type { ErStatus } from '@/mockData/aedAndEmergency';
import { ER_STATUS_COLORS, ER_STATUS_LABELS } from '@/mockData/aedAndEmergency';

type ErDashboardProps = {
  totalHospitals: number;
  totalAvailableBeds: number;
  totalBeds: number;
  availableCount: number;
  congestedCount: number;
  fullCount: number;
};

export function ErDashboardSummary({
  totalHospitals,
  totalAvailableBeds,
  totalBeds,
  availableCount,
  congestedCount,
  fullCount,
}: ErDashboardProps) {
  const occupancyRate = totalBeds > 0 ? Math.round(((totalBeds - totalAvailableBeds) / totalBeds) * 100) : 0;

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <Text className="text-base font-bold text-slate-900">실시간 응급실 가동 현황</Text>
      <Text className="mt-1 text-xs text-slate-500">가상 GPS 기준 · mockData</Text>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-xl bg-slate-50 p-3">
          <Text className="text-2xl font-bold text-slate-900">{totalAvailableBeds}</Text>
          <Text className="text-xs text-slate-500">가용 병상</Text>
        </View>
        <View className="flex-1 rounded-xl bg-slate-50 p-3">
          <Text className="text-2xl font-bold text-slate-900">{occupancyRate}%</Text>
          <Text className="text-xs text-slate-500">전체 점유율</Text>
        </View>
        <View className="flex-1 rounded-xl bg-slate-50 p-3">
          <Text className="text-2xl font-bold text-slate-900">{totalHospitals}</Text>
          <Text className="text-xs text-slate-500">조회 병원</Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <StatusChip status="available" count={availableCount} />
        <StatusChip status="congested" count={congestedCount} />
        <StatusChip status="full" count={fullCount} />
      </View>
    </View>
  );
}

function StatusChip({ status, count }: { status: ErStatus; count: number }) {
  return (
    <View
      className="flex-1 flex-row items-center justify-center rounded-lg py-2"
      style={{ backgroundColor: `${ER_STATUS_COLORS[status]}18` }}
    >
      <View className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: ER_STATUS_COLORS[status] }} />
      <Text className="text-xs font-semibold" style={{ color: ER_STATUS_COLORS[status] }}>
        {ER_STATUS_LABELS[status]} {count}
      </Text>
    </View>
  );
}

type BedBarProps = {
  available: number;
  total: number;
};

export function BedAvailabilityBar({ available, total }: BedBarProps) {
  const used = total - available;
  const usedPercent = total > 0 ? (used / total) * 100 : 0;

  return (
    <View>
      <View className="mb-1 flex-row justify-between">
        <Text className="text-xs text-slate-500">병상 점유</Text>
        <Text className="text-xs font-semibold text-slate-700">
          {available}/{total} 가용
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-slate-100">
        <View
          className="h-full rounded-full bg-slate-800"
          style={{ width: `${usedPercent}%` }}
        />
      </View>
    </View>
  );
}
