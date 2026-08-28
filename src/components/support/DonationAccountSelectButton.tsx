import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { DonationAccount } from '@/services/donationService';

type DonationAccountSelectButtonProps = {
  account: DonationAccount;
  onPress: (account: DonationAccount) => void;
  disabled?: boolean;
};

/** 후원 계좌 선택 — 탭 시 복사·카카오페이 이동 */
export function DonationAccountSelectButton({
  account,
  onPress,
  disabled = false,
}: DonationAccountSelectButtonProps) {
  return (
    <Pressable
      className={`mb-2.5 flex-row items-center rounded-2xl border px-4 py-3.5 active:opacity-90 ${
        disabled ? 'border-kemix-border bg-kemix-bg opacity-60' : 'border-kemix-border bg-kemix-surface'
      }`}
      disabled={disabled}
      onPress={() => onPress(account)}
      accessibilityRole="button"
      accessibilityLabel={`${account.bank_name} ${account.account_holder} 계좌 선택`}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-amber-50">
        <Text className="text-lg">🏦</Text>
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-kemix-text" numberOfLines={1}>
            {account.bank_name}
          </Text>
          {account.purpose ? (
            <Text className="rounded-full bg-kemix-bg px-2 py-0.5 text-[10px] font-medium text-kemix-text-secondary">
              {account.purpose}
            </Text>
          ) : null}
        </View>
        <Text className="mt-0.5 text-xs text-kemix-text-secondary" numberOfLines={1}>
          예금주: {account.account_holder}
        </Text>
        <Text className="mt-1 text-base font-bold text-kemix-text" numberOfLines={1}>
          {account.account_number}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </Pressable>
  );
}
