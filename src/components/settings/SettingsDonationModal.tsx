import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedColors } from '@/hooks/useThemedColors';
import { DonationAccountCard } from '@/components/support/DonationAccountCard';
import { fetchActiveDonationAccounts } from '@/services/donationService';
import { fetchDonationNotice } from '@/services/siteSettingsService';

type SettingsDonationModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsDonationModal({ visible, onClose }: SettingsDonationModalProps) {
  const { colors } = useThemedColors();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof fetchActiveDonationAccounts>>>([]);
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
    if (!visible) return;
    void load();
  }, [visible, load]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-kemix-bg">
        <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <Text className="text-lg font-bold text-kemix-text">후원하기</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 py-4" contentContainerClassName="pb-8">
          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator color={colors.blue} />
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
              <Ionicons name="heart-outline" size={32} color={colors.border} />
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
