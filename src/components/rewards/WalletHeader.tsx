import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useWallet } from '@/contexts/WalletContext';

export function WalletHeader() {
  const { balance, streak, transactions } = useWallet();

  return (
    <View className="rounded-2xl bg-slate-900 p-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-medium text-slate-400">보유 포인트</Text>
          <Text className="text-3xl font-bold text-white">{balance.toLocaleString()}P</Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1">
            <Ionicons name="flame" size={14} color="#f97316" />
            <Text className="ml-1 text-xs font-semibold text-orange-300">{streak}일 연속</Text>
          </View>
          <Text className="mt-1 text-xs text-slate-500">mockData 지갑</Text>
        </View>
      </View>
      {transactions.length > 0 ? (
        <View className="mt-3 border-t border-white/10 pt-3">
          <Text className="mb-1 text-xs text-slate-500">최근 내역</Text>
          {transactions.slice(0, 2).map((tx) => (
            <View key={tx.id} className="flex-row justify-between py-0.5">
              <Text className="text-xs text-slate-400">{tx.label}</Text>
              <Text
                className={`text-xs font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {tx.amount >= 0 ? '+' : ''}
                {tx.amount}P
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function PointFeedbackToast() {
  const { lastFeedback, clearFeedback } = useWallet();

  useEffect(() => {
    if (!lastFeedback) return;
    const timer = setTimeout(clearFeedback, 2500);
    return () => clearTimeout(timer);
  }, [lastFeedback, clearFeedback]);

  if (!lastFeedback) return null;

  return (
    <View className="absolute bottom-24 left-4 right-4 z-50 items-center">
      <View className="rounded-full bg-slate-900 px-5 py-3 shadow-lg">
        <Text className="text-sm font-semibold text-white">{lastFeedback}</Text>
      </View>
    </View>
  );
}
