import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { PrivateEmsHeader } from '@/components/expert/PrivateEmsHeader';
import { usePrivateEmsDispatch } from '@/contexts/PrivateEmsDispatchContext';
import { formatFare, TRANSPORT_REQUESTS, type TransportRequest } from '@/data/privateEmsMockData';

function TransportRequestCard({
  request,
  onAccept,
}: {
  request: TransportRequest;
  onAccept: (request: TransportRequest) => void;
}) {
  const isUrgent = request.urgency === 'urgent';

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {isUrgent ? (
        <View className="bg-red-600 px-4 py-1">
          <Text className="text-xs font-bold text-white">🚨 긴급 이송</Text>
        </View>
      ) : null}

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-slate-900">
              {request.from} ➡️ {request.to}
            </Text>
            <Text className="mt-1 text-sm text-slate-600">이송 원합니다</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-orange-600">{formatFare(request.fare)}</Text>
            <Text className="mt-0.5 text-xs text-slate-400">{request.distance}</Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-slate-100 px-3 py-1">
            <Text className="text-xs font-medium text-slate-700">{request.patientInfo}</Text>
          </View>
          <View className="rounded-full bg-blue-50 px-3 py-1">
            <Text className="text-xs font-medium text-blue-700">{request.notes}</Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">{request.postedAt} 등록</Text>
          <Pressable
            className="rounded-xl bg-orange-600 px-5 py-2.5 active:bg-orange-700"
            onPress={() => onAccept(request)}
          >
            <Text className="text-sm font-bold text-white">⚡ 실시간 이송 수락하기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function PrivateEmsCallboardScreen() {
  const { hiddenRequestIds, acceptTransportRequest } = usePrivateEmsDispatch();

  const visibleRequests = TRANSPORT_REQUESTS.filter((r) => !hiddenRequestIds.has(r.id));

  const handleAccept = (request: TransportRequest) => {
    acceptTransportRequest(request);
    Alert.alert(
      '배차 완료! 🚑',
      '배차가 완료되었습니다! 환자 위치로 이동하세요.\n\n내 관제 탭에서 매칭 내역을 확인할 수 있습니다.',
      [{ text: '확인', style: 'default' }],
    );
  };

  return (
    <View className="flex-1 bg-slate-100">
      <PrivateEmsHeader subtitle="정기 콜보드 · 실시간 환자 이송 요청" />

      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-slate-900">실시간 민간 배차 콜보드</Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {visibleRequests.length}건 대기 · 요양병원·일반인 이송 요청
            </Text>
          </View>
          <View className="flex-row items-center rounded-full bg-red-50 px-3 py-1.5">
            <View className="mr-1.5 h-2 w-2 rounded-full bg-red-500" />
            <Text className="text-xs font-bold text-red-600">LIVE</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={visibleRequests}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-28"
        ListEmptyComponent={
          <View className="items-center py-16">
            <Ionicons name="checkmark-circle-outline" size={48} color="#94a3b8" />
            <Text className="mt-4 text-base font-semibold text-slate-600">모든 콜이 수락되었습니다</Text>
            <Text className="mt-1 text-sm text-slate-400">새 이송 요청을 기다리는 중...</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransportRequestCard request={item} onAccept={handleAccept} />
        )}
      />
    </View>
  );
}
