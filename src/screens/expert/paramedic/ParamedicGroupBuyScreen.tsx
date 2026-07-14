import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useWallet } from '@/contexts/WalletContext';
import {
  GROUP_BUY_STATUS_COLORS,
  GROUP_BUY_STATUS_LABELS,
  type GroupBuy,
} from '@/mockData/rewards/shop';
import {
  PARAMEDIC_GROUP_BUY_ITEMS,
  PARAMEDIC_GROUP_BUYS,
} from '@/mockData/rewards/paramedicShop';

function GroupBuyCard({
  item,
  joined,
  balance,
  onJoin,
}: {
  item: GroupBuy;
  joined: boolean;
  balance: number;
  onJoin: (gb: GroupBuy) => void;
}) {
  const meta = PARAMEDIC_GROUP_BUY_ITEMS[item.id];
  const progress = Math.min(100, (item.currentOrders / item.minThreshold) * 100);
  const canJoin = item.status !== 'completed' && balance >= item.depositPoints;

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <View className="flex-row items-center bg-slate-900 px-4 py-2">
        <Text className="text-lg">{meta?.emoji ?? '🛒'}</Text>
        <Text className="ml-2 text-xs font-bold text-slate-300">대원 전용 · 일반인 구매 불가</Text>
      </View>

      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-base font-bold text-slate-900">{item.itemName}</Text>
            <Text className="mt-0.5 text-xs text-slate-500">{item.vendorName}</Text>
            {meta?.specs ? (
              <Text className="mt-1 text-xs text-green-700">{meta.specs}</Text>
            ) : null}
          </View>
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${GROUP_BUY_STATUS_COLORS[item.status]}20` }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: GROUP_BUY_STATUS_COLORS[item.status] }}
            >
              {GROUP_BUY_STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-baseline gap-2">
          <Text className="text-xl font-bold text-red-600">
            {item.discountPrice.toLocaleString()}원
          </Text>
          <Text className="text-sm text-slate-400 line-through">
            {item.originalPrice.toLocaleString()}원
          </Text>
          <Text className="text-xs font-semibold text-green-600">
            {Math.round((1 - item.discountPrice / item.originalPrice) * 100)}% OFF
          </Text>
        </View>

        <View className="mt-3">
          <View className="mb-1 flex-row justify-between">
            <Text className="text-xs text-slate-500">
              {item.currentOrders}/{item.minThreshold}명 모집
            </Text>
            <Text className="text-xs font-semibold text-slate-700">{Math.round(progress)}%</Text>
          </View>
          <View className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <View
              className="h-full rounded-full bg-green-600"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xs text-slate-500">마감 {item.deadline}</Text>
          <Text className="text-xs font-semibold text-slate-700">
            참여 보증금 {item.depositPoints}P
          </Text>
        </View>

        {joined ? (
          <View className="mt-3 flex-row items-center justify-center rounded-xl bg-green-50 py-2.5">
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text className="ml-1 text-sm font-semibold text-green-700">참여 완료</Text>
          </View>
        ) : item.status === 'completed' ? (
          <View className="mt-3 items-center rounded-xl bg-slate-100 py-2.5">
            <Text className="text-sm text-slate-500">달성 완료된 공구</Text>
          </View>
        ) : (
          <Pressable
            className={`mt-3 items-center rounded-xl py-3.5 ${canJoin ? 'bg-green-700' : 'bg-slate-200'}`}
            onPress={() => onJoin(item)}
          >
            <Text className={`font-bold ${canJoin ? 'text-white' : 'text-slate-400'}`}>
              {canJoin ? '공구 참여하기' : '포인트 부족'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function ParamedicGroupBuyScreen() {
  const { balance, joinedGroupBuyIds, joinGroupBuy } = useWallet();

  const handleJoin = (gb: GroupBuy) => {
    if (joinedGroupBuyIds.includes(gb.id)) return;
    if (gb.status === 'completed') {
      Alert.alert('모집 종료', '이미 달성 완료된 공동구매입니다.');
      return;
    }
    if (balance < gb.depositPoints) {
      Alert.alert('포인트 부족', `참여 보증금 ${gb.depositPoints}P가 필요합니다.`);
      return;
    }
    Alert.alert(
      '공구 참여',
      `${gb.itemName}\n보증금 ${gb.depositPoints}P를 예치합니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '참여',
          onPress: () => joinGroupBuy(gb.id, gb.depositPoints, gb.itemName),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-slate-100">
      <ParamedicHeader subtitle="공동구매 · 전문 구급 장비 특가" />

      <View className="border-b border-green-200 bg-green-950 px-4 py-3">
        <Text className="text-sm font-bold text-green-100">
          🛒 구급대원만 살 수 있는 전문 장비 공구
        </Text>
        <Text className="mt-1 text-xs text-green-300/80">
          Trauma Bag · 플래시라이트 · Trauma Shears · 전용 피복 · SpO2 등
        </Text>
      </View>

      <FlatList
        data={PARAMEDIC_GROUP_BUYS}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-28"
        renderItem={({ item }) => (
          <GroupBuyCard
            item={item}
            joined={joinedGroupBuyIds.includes(item.id)}
            balance={balance}
            onJoin={handleJoin}
          />
        )}
      />
    </View>
  );
}
