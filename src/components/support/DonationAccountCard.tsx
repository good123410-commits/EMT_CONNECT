import { Text, View } from 'react-native';
import type { DonationAccount } from '@/services/donationService';

export function DonationAccountCard({ account }: { account: DonationAccount }) {
  return (
    <View className="mb-3 rounded-2xl border border-kemix-border bg-kemix-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-kemix-text">{account.bank_name}</Text>
        {account.purpose ? (
          <Text className="text-[11px] font-medium text-kemix-text-secondary">{account.purpose}</Text>
        ) : null}
      </View>
      <Text selectable className="mt-2 text-lg font-bold text-kemix-text">
        {account.account_number}
      </Text>
      <Text className="mt-1 text-sm text-kemix-text-secondary">예금주: {account.account_holder}</Text>
      <Text className="mt-2 text-[10px] text-kemix-muted">계좌번호를 길게 눌러 복사할 수 있습니다.</Text>
    </View>
  );
}
