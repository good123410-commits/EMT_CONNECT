import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { supabase } from '@/lib/supabaseClient';
import { ensureProfile } from '@/services/profileService';
import {
  formatErrorMessage,
  requestAdminApproval,
} from '@/services/adminService';

type Props = {
  onApproved?: () => void;
};

type StatusKind = 'idle' | 'loading' | 'success' | 'error';

function showMessage(title: string, message: string) {
  const safeMessage = typeof message === 'string' ? message : formatErrorMessage(message);
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${safeMessage}`);
    return;
  }
  Alert.alert(title, safeMessage);
}

export function AdminApprovalPanel({ onApproved }: Props) {
  const { user } = useAuth();
  const { userEmail, isDbAdmin, reload } = useLiveDbAdmin();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<StatusKind>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const resolved = user?.email ?? userEmail ?? '';
    if (resolved) setEmail(resolved);
  }, [user?.email, userEmail]);

  const handleApprove = async () => {
    setStatusMessage('');

    if (!user?.id) {
      const msg = '관리자 승인을 위해 먼저 로그인해 주세요.';
      setStatus('error');
      setStatusMessage(msg);
      showMessage('로그인 필요', msg);
      return;
    }

    setStatus('loading');
    setStatusMessage('승인 처리 중입니다...');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error(
          'Supabase 세션이 없습니다. 로그아웃 후 다시 로그인하고 승인을 시도해 주세요.',
        );
      }

      try {
        await ensureProfile(
          user.id,
          user.user_metadata?.name as string | undefined,
          user.email ?? email.trim(),
        );
      } catch {
        // 프로필 생성 실패해도 승인 RPC/upsert가 처리함
      }

      await requestAdminApproval(user.id, user.email ?? email.trim());
      await reload();

      const successMsg = '관리자 계정이 승인되었습니다. 전체 관리 기능을 사용할 수 있습니다.';
      setStatus('success');
      setStatusMessage(successMsg);
      showMessage('승인 완료', successMsg);
      onApproved?.();
    } catch (error) {
      const message = formatErrorMessage(error);
      setStatus('error');
      setStatusMessage(message);
      showMessage('승인 실패', message);
    }
  };

  const isLoading = status === 'loading';
  const canSubmit = Boolean(user?.id) && !isLoading;

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <Text className="text-base font-bold text-slate-900">관리자 계정 승인</Text>
      <Text className="mt-2 text-sm leading-6 text-slate-600">
        [승인 요청]을 누르면 현재 로그인 계정이 관리자(admin)로 승인됩니다.
      </Text>

      {!user?.id ? (
        <View className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <Text className="text-sm font-semibold text-red-700">로그인이 필요합니다</Text>
        </View>
      ) : (
        <View className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Text className="text-xs text-slate-500">로그인 계정</Text>
          <Text className="mt-0.5 text-sm font-semibold text-slate-800">{user.email ?? '—'}</Text>
        </View>
      )}

      <View className="mt-4">
        <AdminFormField
          label="관리자 이메일"
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
        />
      </View>

      <Pressable
        className={`items-center rounded-xl py-3.5 ${
          !canSubmit ? 'bg-violet-300' : 'bg-violet-700 active:bg-violet-800'
        }`}
        disabled={!canSubmit}
        onPress={() => void handleApprove()}
      >
        <Text className="font-bold text-white">
          {isLoading ? '승인 처리 중...' : '승인 요청'}
        </Text>
      </Pressable>

      {statusMessage ? (
        <View
          className={`mt-3 rounded-xl p-3 ${
            status === 'success'
              ? 'border border-green-200 bg-green-50'
              : status === 'error'
                ? 'border border-red-200 bg-red-50'
                : 'border border-slate-200 bg-slate-50'
          }`}
        >
          <Text
            className={`text-sm leading-6 ${
              status === 'success'
                ? 'text-green-800'
                : status === 'error'
                  ? 'text-red-700'
                  : 'text-slate-600'
            }`}
          >
            {statusMessage}
          </Text>
        </View>
      ) : null}

      {!isDbAdmin ? (
        <Text className="mt-3 text-xs text-amber-700">
          계속 실패하면 로그아웃 → 재로그인 후, Supabase SQL Editor에서
          migration_v5_admin_email_approval.sql을 실행해 주세요.
        </Text>
      ) : null}
    </View>
  );
}
