import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_COLORS } from '@/constants/appTheme';
import { fetchActiveDonationAccounts, type DonationAccount } from '@/services/donationService';
import { fetchDonationNotice } from '@/services/siteSettingsService';

type SettingsDonationModalProps = {
  visible: boolean;
  onClose: () => void;
};

function DonationAccountCard({ account }: { account: DonationAccount }) {
  return (
    <View
      className="mb-3 rounded-2xl border border-kemix-border bg-kemix-surface p-4"
      style={{ borderColor: APP_COLORS.border }}
    >
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

export function SettingsDonationModal({ visible, onClose }: SettingsDonationModalProps) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [noticeText, rows] = await Promise.all([
        fetchDonationNotice(),
        fetchActiveDonationAccounts(),
      ]);
      setNotice(noticeText);
      setAccounts(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : '후원 정보를 불러오지 못했습니다.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-kemix-bg">
        <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <Text className="text-lg font-bold text-kemix-text">후원하기</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 py-4" contentContainerClassName="pb-8">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={APP_COLORS.blue} />
            </View>
          ) : null}

          {error ? (
            <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          ) : null}

          {!loading && notice.trim().length > 0 ? (
            <View className="mb-4 rounded-2xl border border-kemix-border bg-kemix-surface p-4">
              <Text className="text-sm leading-6 text-kemix-text">{notice}</Text>
            </View>
          ) : null}

          {!loading && accounts.length > 0 ? (
            <>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-kemix-muted">
                후원 계좌
              </Text>
              {accounts.map((account) => <DonationAccountCard key={account.id} account={account} />)}
            </>
          ) : null}

          {!loading && !error && accounts.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-12">
              <Ionicons name="heart-outline" size={32} color="#cbd5e1" />
              <Text className="mt-3 text-sm text-kemix-text-secondary">등록된 후원 계좌가 없습니다.</Text>
            </View>
          ) : null}

          <Text className="mt-4 text-center text-[11px] leading-5 text-kemix-muted">
            앱 내 결제·모금 처리는 하지 않습니다. 계좌 이체로 후원해 주세요.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
