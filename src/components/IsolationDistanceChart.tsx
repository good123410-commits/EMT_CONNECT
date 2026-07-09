import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { IsolationZone } from '@/mockData/hazardousMaterials';

type IsolationDistanceChartProps = {
  zones: IsolationZone[];
  maxDistanceM?: number;
};

export function IsolationDistanceChart({ zones, maxDistanceM }: IsolationDistanceChartProps) {
  const max = maxDistanceM ?? Math.max(...zones.map((z) => z.distanceM), 100);

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="mb-3 flex-row items-center">
        <Ionicons name="radio-button-on" size={16} color="#ef4444" />
        <Text className="ml-2 text-sm font-semibold text-slate-700">누출원 (사고 지점)</Text>
      </View>

      <View className="relative ml-2 border-l-2 border-dashed border-slate-300 pl-6">
        {zones.map((zone) => {
          const widthPercent = Math.min(100, (zone.distanceM / max) * 100);
          return (
            <View key={zone.label} className="mb-4">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-800">{zone.label}</Text>
                <Text className="text-sm font-bold" style={{ color: zone.color }}>
                  {zone.distanceM}m
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full bg-slate-100">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${widthPercent}%`, backgroundColor: zone.color }}
                />
              </View>
              <Text className="mt-1 text-xs text-slate-500">{zone.description}</Text>
            </View>
          );
        })}
      </View>

      <View className="mt-2 flex-row items-center rounded-lg bg-slate-50 px-3 py-2">
        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
        <Text className="ml-2 flex-1 text-xs text-slate-500">
          ERG 기준 가상 이격 거리입니다. 실제 현장에서는 바람·지형·누출량에 따라 달라집니다.
        </Text>
      </View>
    </View>
  );
}
