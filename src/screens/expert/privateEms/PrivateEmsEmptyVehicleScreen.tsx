import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { PrivateEmsHeader } from '@/components/expert/PrivateEmsHeader';
import { usePrivateEmsDispatch } from '@/contexts/PrivateEmsDispatchContext';
import {
  EMPTY_RETURN_REQUESTS,
  formatFare,
  RETURN_DESTINATIONS,
  type EmptyReturnRequest,
  type ReturnDestination,
} from '@/data/privateEmsMockData';

function EmptyReturnCard({
  request,
  onAccept,
}: {
  request: EmptyReturnRequest;
  onAccept: (request: EmptyReturnRequest) => void;
}) {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
      <View className="flex-row items-center bg-indigo-600 px-4 py-2">
        <Ionicons name="swap-horizontal" size={14} color="#c7d2fe" />
        <Text className="ml-2 text-xs font-bold text-indigo-100">
          {request.fromRegion} → {request.toRegion} 역방향 매칭
        </Text>
      </View>

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-slate-900">
              {request.from} ➡️ {request.to}
            </Text>
            <Text className="mt-1 text-sm text-slate-600">{request.patientInfo} · {request.notes}</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-indigo-600">
              {formatFare(request.fare + request.emptyReturnBonus)}
            </Text>
            <Text className="mt-0.5 text-xs text-emerald-600">
              공차 보너스 +{formatFare(request.emptyReturnBonus)}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-400">{request.distance}</Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">{request.postedAt} 등록</Text>
          <Pressable
            className="rounded-xl bg-indigo-600 px-5 py-2.5 active:bg-indigo-700"
            onPress={() => onAccept(request)}
          >
            <Text className="text-sm font-bold text-white">복귀 매칭 수락</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function PrivateEmsEmptyVehicleScreen() {
  const { hiddenRequestIds, acceptEmptyReturnRequest } = usePrivateEmsDispatch();
  const [destination, setDestination] = useState<ReturnDestination>('서울');

  const filteredRequests = useMemo(
    () =>
      EMPTY_RETURN_REQUESTS.filter(
        (r) => r.toRegion === destination && !hiddenRequestIds.has(r.id),
      ),
    [destination, hiddenRequestIds],
  );

  const handleAccept = (request: EmptyReturnRequest) => {
    acceptEmptyReturnRequest(request);
    Alert.alert(
      '복귀 매칭 완료! 🛣️',
      `${request.fromRegion} → ${request.toRegion} 역방향 매칭이 확정되었습니다.\n기름값·공차율 0% 복귀 루트를 이용하세요!`,
      [{ text: '확인' }],
    );
  };

  return (
    <View className="flex-1 bg-slate-100">
      <PrivateEmsHeader subtitle="공차 매칭 · 전국 복귀 네트워크" />

      <View className="border-b border-indigo-100 bg-indigo-950 px-4 py-4">
        <Text className="text-sm font-bold leading-5 text-indigo-100">
          🛣️ 기름값과 공차율을 0%로 줄여주는 복귀 매칭 건
        </Text>
        <Text className="mt-1 text-xs text-indigo-300">
          장거리 콜 후 빈 차로 복귀할 때, 역방향 환자 이송으로 수익을 극대화하세요
        </Text>
      </View>

      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <Text className="mb-2 text-xs font-semibold text-slate-500">현재 내 복귀 목적지</Text>
        <View className="flex-row flex-wrap gap-2">
          {RETURN_DESTINATIONS.map((region) => {
            const active = destination === region;
            return (
              <Pressable
                key={region}
                onPress={() => setDestination(region)}
                className={`rounded-full px-4 py-2 ${active ? 'bg-indigo-600' : 'bg-slate-100'}`}
              >
                <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                  {region}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="mt-2 text-xs text-slate-400">
          {destination}(으)로 복귀 중인 기사님을 위한 역방향 요청 {filteredRequests.length}건
        </Text>
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-28"
        ListEmptyComponent={
          <View className="items-center py-16">
            <Ionicons name="car-outline" size={48} color="#94a3b8" />
            <Text className="mt-4 text-base font-semibold text-slate-600">
              {destination} 방향 복귀 매칭 건이 없습니다
            </Text>
            <Text className="mt-1 text-sm text-slate-400">다른 목적지를 선택해 보세요</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EmptyReturnCard request={item} onAccept={handleAccept} />
        )}
      />
    </View>
  );
}
