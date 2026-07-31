import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { useWallet } from '@/contexts/WalletContext';
import {
  GIFT_CARDS,
  GROUP_BUYS,
  GROUP_BUY_STATUS_COLORS,
  GROUP_BUY_STATUS_LABELS,
  type GiftCard,
  type GroupBuy,
} from '@/mockData/rewards/shop';

type ShopTab = 'gift' | 'groupbuy';

export function ShopModule() {
  const [tab, setTab] = useState<ShopTab>('gift');

  return (
    <View className="gap-3">
      <SegmentControl
        options={[
          { value: 'gift', label: '기프티콘' },
          { value: 'groupbuy', label: '공동구매' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'gift' ? <GiftCardList /> : <GroupBuyList />}
    </View>
  );
}

function GiftCardList() {
  const { balance, purchasedGiftIds, purchaseGift } = useWallet();

  const handlePurchase = (gift: GiftCard) => {
    if (purchasedGiftIds.includes(gift.id)) return;
    if (balance < gift.pricePoints) {
      Alert.alert('포인트 부족', `${gift.pricePoints}P가 필요합니다. (보유: ${balance}P)`);
      return;
    }
    Alert.alert(
      '구매 확인',
      `${gift.name} (${gift.pricePoints}P)을(를) 구매하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매',
          onPress: () => purchaseGift(gift.id, gift.pricePoints, gift.name),
        },
      ],
    );
  };

  return (
    <View className="gap-3">
      {GIFT_CARDS.map((gift) => {
        const purchased = purchasedGiftIds.includes(gift.id);
        const canAfford = balance >= gift.pricePoints;
        return (
          <View
            key={gift.id}
            className={`rounded-2xl border p-4 ${purchased ? 'border-green-200 bg-green-50' : 'border-kemix-border bg-kemix-surface'}`}
          >
            <View className="flex-row items-center">
              <Text className="text-4xl">{gift.imageEmoji}</Text>
              <View className="ml-3 flex-1">
                <Text className="text-xs font-medium text-kemix-text-secondary">{gift.brand}</Text>
                <Text className="text-base font-bold text-kemix-text">{gift.name}</Text>
                <Text className="mt-0.5 text-xs text-kemix-text-secondary">{gift.description}</Text>
              </View>
              <Text className="text-lg font-bold text-kemix-text">{gift.pricePoints}P</Text>
            </View>
            {purchased ? (
              <View className="mt-3 flex-row items-center justify-center rounded-xl bg-green-100 py-2">
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text className="ml-1 text-sm font-semibold text-green-700">구매 완료</Text>
              </View>
            ) : (
              <Pressable
                className={`mt-3 items-center rounded-xl py-3 ${canAfford ? 'bg-slate-900' : 'bg-kemix-elevated'}`}
                onPress={() => handlePurchase(gift)}
              >
                <Text className={`font-semibold ${canAfford ? 'text-white' : 'text-kemix-muted'}`}>
                  {canAfford ? '포인트로 구매' : '포인트 부족'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

function GroupBuyList() {
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
    <View className="gap-3">
      {GROUP_BUYS.map((gb) => {
        const joined = joinedGroupBuyIds.includes(gb.id);
        const progress = Math.min(100, (gb.currentOrders / gb.minThreshold) * 100);
        const canJoin = gb.status !== 'completed' && balance >= gb.depositPoints;

        return (
          <View key={gb.id} className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-kemix-text">{gb.itemName}</Text>
                <Text className="mt-0.5 text-xs text-kemix-text-secondary">{gb.vendorName}</Text>
              </View>
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${GROUP_BUY_STATUS_COLORS[gb.status]}20` }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: GROUP_BUY_STATUS_COLORS[gb.status] }}
                >
                  {GROUP_BUY_STATUS_LABELS[gb.status]}
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-baseline gap-2">
              <Text className="text-lg font-bold text-red-600">
                {gb.discountPrice.toLocaleString()}원
              </Text>
              <Text className="text-sm text-kemix-muted line-through">
                {gb.originalPrice.toLocaleString()}원
              </Text>
            </View>

            <View className="mt-3">
              <View className="mb-1 flex-row justify-between">
                <Text className="text-xs text-kemix-text-secondary">
                  {gb.currentOrders}/{gb.minThreshold}명 모집
                </Text>
                <Text className="text-xs font-semibold text-kemix-text">{Math.round(progress)}%</Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-kemix-elevated">
                <View
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-xs text-kemix-text-secondary">마감 {gb.deadline}</Text>
              <Text className="text-xs font-semibold text-kemix-text">
                참여 보증금 {gb.depositPoints}P
              </Text>
            </View>

            {joined ? (
              <View className="mt-3 flex-row items-center justify-center rounded-xl bg-blue-50 py-2">
                <Ionicons name="people" size={16} color="#2563eb" />
                <Text className="ml-1 text-sm font-semibold text-blue-700">참여 완료</Text>
              </View>
            ) : gb.status === 'completed' ? (
              <View className="mt-3 items-center rounded-xl bg-kemix-elevated py-2">
                <Text className="text-sm text-kemix-text-secondary">달성 완료된 공구</Text>
              </View>
            ) : (
              <Pressable
                className={`mt-3 items-center rounded-xl py-3 ${canJoin ? 'bg-blue-600' : 'bg-kemix-elevated'}`}
                onPress={() => handleJoin(gb)}
              >
                <Text className={`font-semibold ${canJoin ? 'text-white' : 'text-kemix-muted'}`}>
                  {canJoin ? '공구 참여하기' : '포인트 부족'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
