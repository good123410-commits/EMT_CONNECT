import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, ScrollView, Switch, Text, View } from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  adminDeleteDonationAccount,
  adminListDonationAccounts,
  adminUpsertDonationAccount,
  type DonationAccount,
  type UpsertDonationInput,
} from '@/services/donationService';
import { fetchAppSettings, updateAppSettings } from '@/services/appSettingsService';
import { adminUpsertSiteSetting, fetchDonationNotice } from '@/services/siteSettingsService';
import { useAppConfig } from '@/contexts/AppConfigContext';

const EMPTY_FORM: UpsertDonationInput = {
  bank_name: '',
  account_number: '',
  account_holder: '',
  purpose: '',
  display_order: 0,
  is_active: true,
};

export function AdminDonationPanel() {
  const { reload: reloadAppConfig } = useAppConfig();
  const [loading, setLoading] = useState(true);
  const [savingLink, setSavingLink] = useState(false);
  const [savingNotice, setSavingNotice] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [kakaoPayLink, setKakaoPayLink] = useState('');
  const [donationNotice, setDonationNotice] = useState('');
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [form, setForm] = useState<UpsertDonationInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, notice, rows] = await Promise.all([
        fetchAppSettings(),
        fetchDonationNotice(),
        adminListDonationAccounts(),
      ]);
      setKakaoPayLink(settings.kakaotalk_pay_link);
      setDonationNotice(notice);
      setAccounts(rows);
    } catch (error) {
      Alert.alert('조회 실패', error instanceof Error ? error.message : '후원 설정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSaveKakaoLink = async () => {
    setSavingLink(true);
    try {
      await updateAppSettings(kakaoPayLink);
      await reloadAppConfig();
      Alert.alert('저장 완료', '카카오페이 송금 링크가 반영되었습니다.');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '링크 저장에 실패했습니다.');
    } finally {
      setSavingLink(false);
    }
  };

  const handleSaveNotice = async () => {
    setSavingNotice(true);
    try {
      await adminUpsertSiteSetting({
        key: 'donation_notice',
        title: '후원 안내',
        content: donationNotice.trim(),
      });
      Alert.alert('저장 완료', '후원 안내 문구가 반영되었습니다.');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '안내 문구 저장에 실패했습니다.');
    } finally {
      setSavingNotice(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (account: DonationAccount) => {
    setEditingId(account.id);
    setForm({
      id: account.id,
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder: account.account_holder,
      purpose: account.purpose,
      display_order: account.display_order,
      is_active: account.is_active,
    });
  };

  const handleSaveAccount = async () => {
    if (!form.bank_name.trim() || !form.account_number.trim() || !form.account_holder.trim()) {
      Alert.alert('입력 확인', '은행명, 계좌번호, 예금주는 필수입니다.');
      return;
    }

    setSavingAccount(true);
    try {
      await adminUpsertDonationAccount({
        ...form,
        bank_name: form.bank_name.trim(),
        account_number: form.account_number.trim(),
        account_holder: form.account_holder.trim(),
        purpose: form.purpose.trim(),
      });
      Alert.alert('저장 완료', editingId ? '계좌가 수정되었습니다.' : '계좌가 추가되었습니다.');
      resetForm();
      await reload();
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '계좌 저장에 실패했습니다.');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    Alert.alert('계좌 삭제', '이 후원 계좌를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await adminDeleteDonationAccount(id);
              if (editingId === id) resetForm();
              await reload();
            } catch (error) {
              Alert.alert('삭제 실패', error instanceof Error ? error.message : '삭제에 실패했습니다.');
            }
          })();
        },
      },
    ]);
  };

  const handleToggleActive = async (account: DonationAccount) => {
    try {
      await adminUpsertDonationAccount({
        id: account.id,
        bank_name: account.bank_name,
        account_number: account.account_number,
        account_holder: account.account_holder,
        purpose: account.purpose,
        display_order: account.display_order,
        is_active: !account.is_active,
      });
      await reload();
    } catch (error) {
      Alert.alert('변경 실패', error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 pb-8">
      <View className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
        <Text className="text-sm font-bold text-violet-900">커피잔 · 후원 연동</Text>
        <Text className="mt-1 text-xs leading-5 text-violet-800">
          상단 커피 아이콘과 설정의 「후원하기」에 즉시 반영됩니다.
        </Text>
      </View>

      <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
        <Text className="mb-3 text-sm font-bold text-kemix-text">카카오페이 송금 링크</Text>
        <AdminFormField
          label="송금 URL / 딥링크"
          value={kakaoPayLink}
          onChangeText={setKakaoPayLink}
          placeholder="kakaotalk://kakaopay/money/send?..."
        />
        <Pressable
          className="items-center rounded-xl bg-violet-700 py-3 active:bg-violet-800"
          disabled={savingLink}
          onPress={() => void handleSaveKakaoLink()}
        >
          <Text className="font-bold text-white">{savingLink ? '저장 중…' : '링크 저장'}</Text>
        </Pressable>
      </View>

      <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
        <Text className="mb-3 text-sm font-bold text-kemix-text">후원 안내 문구</Text>
        <AdminFormField
          label="안내 텍스트"
          value={donationNotice}
          onChangeText={setDonationNotice}
          placeholder="후원 목적과 이용 안내를 입력하세요."
          multiline
        />
        <Pressable
          className="items-center rounded-xl border border-kemix-border py-3 active:bg-kemix-bg"
          disabled={savingNotice}
          onPress={() => void handleSaveNotice()}
        >
          <Text className="font-semibold text-kemix-text">{savingNotice ? '저장 중…' : '안내 저장'}</Text>
        </Pressable>
      </View>

      <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
        <Text className="mb-3 text-sm font-bold text-kemix-text">
          {editingId ? '계좌 수정' : '후원 계좌 추가'}
        </Text>
        <AdminFormField label="은행명" value={form.bank_name} onChangeText={(v) => setForm((f) => ({ ...f, bank_name: v }))} />
        <AdminFormField
          label="계좌번호"
          value={form.account_number}
          onChangeText={(v) => setForm((f) => ({ ...f, account_number: v }))}
        />
        <AdminFormField
          label="예금주"
          value={form.account_holder}
          onChangeText={(v) => setForm((f) => ({ ...f, account_holder: v }))}
        />
        <AdminFormField
          label="모금 목적 (선택)"
          value={form.purpose}
          onChangeText={(v) => setForm((f) => ({ ...f, purpose: v }))}
        />
        <AdminFormField
          label="표시 순서"
          value={String(form.display_order)}
          onChangeText={(v) => setForm((f) => ({ ...f, display_order: Number(v) || 0 }))}
          keyboardType="numeric"
        />
        <View className="mb-3 flex-row items-center justify-between rounded-xl border border-kemix-border px-3 py-2.5">
          <Text className="text-sm text-kemix-text">공개 (활성)</Text>
          <Switch value={form.is_active} onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
        </View>
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 items-center rounded-xl bg-violet-700 py-3 active:bg-violet-800"
            disabled={savingAccount}
            onPress={() => void handleSaveAccount()}
          >
            <Text className="font-bold text-white">
              {savingAccount ? '저장 중…' : editingId ? '수정 저장' : '계좌 추가'}
            </Text>
          </Pressable>
          {editingId ? (
            <Pressable
              className="items-center justify-center rounded-xl border border-kemix-border px-4 active:bg-kemix-bg"
              onPress={resetForm}
            >
              <Text className="font-semibold text-kemix-text-secondary">취소</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-bold uppercase tracking-wide text-kemix-muted">등록된 계좌</Text>
        {accounts.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-kemix-border py-10">
            <Ionicons name="card-outline" size={28} color="#cbd5e1" />
            <Text className="mt-2 text-sm text-kemix-text-secondary">등록된 후원 계좌가 없습니다.</Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View
              key={account.id}
              className={`rounded-2xl border p-4 ${
                account.is_active ? 'border-kemix-border bg-kemix-surface' : 'border-dashed border-kemix-border bg-kemix-bg opacity-70'
              }`}
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-kemix-text">{account.bank_name}</Text>
                  <Text className="mt-1 text-base font-semibold text-kemix-text">{account.account_number}</Text>
                  <Text className="mt-1 text-xs text-kemix-text-secondary">예금주: {account.account_holder}</Text>
                  {account.purpose ? (
                    <Text className="mt-1 text-xs text-kemix-muted">{account.purpose}</Text>
                  ) : null}
                </View>
                <Pressable
                  className={`rounded-full px-2.5 py-1 ${account.is_active ? 'bg-green-100' : 'bg-kemix-bg'}`}
                  onPress={() => void handleToggleActive(account)}
                >
                  <Text className={`text-[11px] font-bold ${account.is_active ? 'text-green-800' : 'text-kemix-muted'}`}>
                    {account.is_active ? '활성' : '비활성'}
                  </Text>
                </Pressable>
              </View>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  className="flex-1 items-center rounded-lg border border-kemix-border py-2 active:bg-kemix-bg"
                  onPress={() => startEdit(account)}
                >
                  <Text className="text-xs font-semibold text-kemix-text-secondary">수정</Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center rounded-lg border border-red-200 py-2 active:bg-red-50"
                  onPress={() => handleDeleteAccount(account.id)}
                >
                  <Text className="text-xs font-semibold text-red-600">삭제</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
