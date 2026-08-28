import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Modal, ScrollView, Text, View } from 'react-native';
import { DonationAccountSelectButton } from '@/components/support/DonationAccountSelectButton';
import { COFFEE_SUPPORT_THANKS_MESSAGE } from '@/constants/appSettings';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { fetchActiveDonationAccounts, type DonationAccount } from '@/services/donationService';
import { fetchDonationNotice } from '@/services/siteSettingsService';
import { copyDonationAccountAndOpenKakaoPay } from '@/utils/donationSupportFlow';

type CoffeeSupportModalProps = {
  visible: boolean;
  onClose: () => void;
  kakaoTalkPayLink: string;
};

/** 커피 후원 — 계좌 선택 → 복사 → 카카오페이 이동 */
export function CoffeeSupportModal({ visible, onClose, kakaoTalkPayLink }: CoffeeSupportModalProps) {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [notice, setNotice] = useState('');
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [noticeText, rows] = await Promise.all([fetchDonationNotice(), fetchActiveDonationAccounts()]);
      setNotice(noticeText);
      setAccounts(rows);
    } catch {
      setNotice('');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setSelecting(false);
      return;
    }
    void load();
  }, [visible, load]);

  const handleSelectAccount = async (account: DonationAccount) => {
    if (selecting) return;
    setSelecting(true);
    try {
      onClose();
      await copyDonationAccountAndOpenKakaoPay(account, kakaoTalkPayLink);
    } catch {
      Alert.alert('오류', '계좌번호 복사에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
        onPress={onClose}
      >
        <Pressable
          className="max-h-[85%] w-full max-w-sm rounded-2xl"
          style={{ backgroundColor: colors.surface }}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView contentContainerClassName="p-5 pb-4" keyboardShouldPersistTaps="handled">
            <Text className="text-center text-4xl">☕</Text>
            <Text
              className="mt-3 text-center text-base font-semibold text-kemix-text"
              style={{ fontFamily: 'Pretendard-SemiBold', color: colors.textPrimary }}
            >
              후원 계좌 선택
            </Text>
            <Text
              className="mt-2 text-center text-sm leading-6 text-kemix-text-secondary"
              style={{ fontFamily: 'Pretendard-Medium' }}
            >
              {COFFEE_SUPPORT_THANKS_MESSAGE}
            </Text>
            <Text className="mt-2 text-center text-xs leading-5 text-kemix-muted">
              계좌를 선택하면 번호가 자동 복사되고 카카오페이로 이동합니다.
            </Text>

            {loading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.blue} />
              </View>
            ) : null}

            {!loading && notice.trim().length > 0 ? (
              <View className="mt-4 rounded-xl border border-kemix-border bg-kemix-bg p-3">
                <Text className="text-sm leading-6 text-kemix-text-secondary">{notice}</Text>
              </View>
            ) : null}

            {!loading && accounts.length > 0 ? (
              <View className="mt-4">
                {accounts.map((account) => (
                  <DonationAccountSelectButton
                    key={account.id}
                    account={account}
                    disabled={selecting}
                    onPress={(selected) => void handleSelectAccount(selected)}
                  />
                ))}
              </View>
            ) : null}

            {!loading && accounts.length === 0 ? (
              <View className="mt-4 items-center rounded-2xl border border-dashed border-kemix-border py-10">
                <Text className="text-3xl">🏦</Text>
                <Text className="mt-2 text-sm font-semibold text-kemix-text">등록된 후원 계좌가 없습니다</Text>
                <Text className="mt-1 px-4 text-center text-xs text-kemix-text-secondary">
                  관리자가 계좌를 등록하면 여기에 표시됩니다.
                </Text>
              </View>
            ) : null}

            <Pressable
              className="mt-4 items-center rounded-xl border border-kemix-border py-3 active:opacity-80"
              onPress={onClose}
              disabled={selecting}
            >
              <Text className="text-sm font-semibold text-kemix-text-secondary">닫기</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
