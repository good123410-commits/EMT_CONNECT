import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  adminCreateInvitationCodeAndSendEmail,
  adminListInvitationCodes,
  adminListPendingVerifications,
  adminReviewVerification,
  adminSendInvitationEmail,
  AdminServiceError,
  formatErrorMessage,
} from '@/services/adminService';
import type { AdminInvitationCode, AdminVerificationRow } from '@/types/admin';
import type { UserRole } from '@/lib/supabaseClient';
import { getRoleLabel } from '@/utils/roleAccess';

const INVITE_ROLES: UserRole[] = ['paramedic', 'hospital', 'private_ems', 'admin'];

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function AdminAuthPanel() {
  const [verifications, setVerifications] = useState<AdminVerificationRow[]>([]);
  const [codes, setCodes] = useState<AdminInvitationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteRole, setInviteRole] = useState<UserRole>('paramedic');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);
  const [sendingCodeId, setSendingCodeId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, invitationCodes] = await Promise.all([
        adminListPendingVerifications(),
        adminListInvitationCodes(),
      ]);
      setVerifications(pending);
      setCodes(invitationCodes);
    } catch (error) {
      showAlert('조회 실패', formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleReview = async (row: AdminVerificationRow, status: 'approved' | 'rejected') => {
    try {
      await adminReviewVerification(row.id, status, status === 'approved' ? '관리자 승인' : '관리자 반려');
      showAlert('완료', status === 'approved' ? '승인되었습니다.' : '반려되었습니다.');
      await reload();
    } catch (error) {
      showAlert('실패', formatErrorMessage(error));
    }
  };

  const handleCreateCode = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      showAlert('이메일 필요', '초대 코드를 메일로 내려면 수신 이메일을 입력해 주세요.');
      return;
    }

    setCreatingCode(true);
    setStatusMessage('코드 생성 및 이메일 전송 중...');
    try {
      const created = await adminCreateInvitationCodeAndSendEmail(inviteRole, email, 30);
      setCodes((prev) => [created, ...prev]);
      setStatusMessage(`${email}로 초대 메일을 전송했습니다.`);
      showAlert('전송 완료', `초대 코드가 생성되어 ${email}로 발송되었습니다.\n\n코드: ${created.code}`);
    } catch (error) {
      const message = formatErrorMessage(error);
      setStatusMessage(message);
      showAlert('전송 실패', message);
    } finally {
      setCreatingCode(false);
    }
  };

  const handleResendEmail = async (item: AdminInvitationCode) => {
    const email = inviteEmail.trim();
    if (!email) {
      showAlert('이메일 필요', '상단 입력란에 수신 이메일을 입력한 뒤 다시 시도해 주세요.');
      return;
    }

    setSendingCodeId(item.id);
    try {
      await adminSendInvitationEmail({
        to: email,
        code: item.code,
        targetRole: item.target_role,
        expiresAt: item.expires_at,
      });
      showAlert('전송 완료', `${email}로 초대 메일을 다시 보냈습니다.`);
    } catch (error) {
      showAlert('전송 실패', formatErrorMessage(error));
    } finally {
      setSendingCodeId(null);
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
    <ScrollView contentContainerClassName="pb-10">
      <Text className="mb-2 text-xs font-bold uppercase text-slate-400">자격증 승인 대기</Text>
      {verifications.length === 0 ? (
        <View className="mb-5 rounded-xl border border-dashed border-slate-200 bg-white py-8">
          <Text className="text-center text-sm text-slate-500">대기 중인 인증 요청이 없습니다.</Text>
        </View>
      ) : (
        verifications.map((row) => (
          <View key={row.id} className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-400">유저 {row.user_id.slice(0, 8)}…</Text>
            <Text className="mt-1 text-sm text-slate-700" numberOfLines={1}>
              {row.document_url}
            </Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg bg-green-600 py-2"
                onPress={() => void handleReview(row, 'approved')}
              >
                <Text className="text-xs font-bold text-white">승인</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-lg bg-red-100 py-2"
                onPress={() => void handleReview(row, 'rejected')}
              >
                <Text className="text-xs font-bold text-red-700">반려</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Text className="mb-2 mt-4 text-xs font-bold uppercase text-slate-400">초대 코드 생성 · 이메일 전송</Text>
      <View className="rounded-xl border border-slate-200 bg-white p-3">
        <Text className="mb-2 text-xs text-slate-500">대상 역할</Text>
        <SegmentControl
          options={INVITE_ROLES.map((role) => ({ value: role, label: getRoleLabel(role) }))}
          value={inviteRole}
          onChange={setInviteRole}
        />
        <View className="mt-3">
          <AdminFormField
            label="수신 이메일"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
          />
        </View>
        <Pressable
          className={`mt-1 items-center rounded-xl py-3 ${creatingCode ? 'bg-violet-300' : 'bg-violet-700'}`}
          disabled={creatingCode}
          onPress={() => void handleCreateCode()}
        >
          <Text className="font-bold text-white">
            {creatingCode ? '생성 · 전송 중...' : '비밀코드 생성 및 이메일 전송'}
          </Text>
        </Pressable>
        {statusMessage ? (
          <Text className="mt-3 text-xs leading-5 text-slate-600">{statusMessage}</Text>
        ) : null}
        <Text className="mt-3 text-[11px] leading-5 text-slate-400">
          Resend API로 실제 메일이 발송됩니다. Supabase Edge Functions Secrets에 RESEND_API_KEY가
          필요합니다(앱 .env 아님). scripts\set-edge-function-secrets.ps1 또는 대시보드에서 등록하세요.
        </Text>
      </View>

      <Text className="mb-2 mt-5 text-xs font-bold uppercase text-slate-400">발급 코드 목록</Text>
      <FlatList
        data={codes}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="py-4 text-center text-sm text-slate-500">발급된 코드가 없습니다.</Text>
        }
        renderItem={({ item }) => (
          <View className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-mono text-sm font-bold text-slate-900">{item.code}</Text>
              <Text className="text-xs text-slate-500">{getRoleLabel(item.target_role)}</Text>
            </View>
            <Text className="mt-1 text-[11px] text-slate-400">
              {new Date(item.created_at).toLocaleString('ko-KR')}
              {item.used_at ? ' · 사용됨' : ' · 미사용'}
            </Text>
            <View className="mt-2 flex-row gap-2">
              <Pressable
                className="flex-row items-center rounded-lg bg-slate-100 px-2.5 py-1.5"
                onPress={() => void Share.share({ message: item.code })}
              >
                <Ionicons name="copy-outline" size={14} color="#475569" />
                <Text className="ml-1 text-[11px] font-bold text-slate-700">공유</Text>
              </Pressable>
              <Pressable
                className={`flex-row items-center rounded-lg px-2.5 py-1.5 ${
                  sendingCodeId === item.id ? 'bg-blue-200' : 'bg-blue-100'
                }`}
                disabled={sendingCodeId === item.id}
                onPress={() => void handleResendEmail(item)}
              >
                <Ionicons name="mail-outline" size={14} color="#1d4ed8" />
                <Text className="ml-1 text-[11px] font-bold text-blue-700">
                  {sendingCodeId === item.id ? '전송 중' : '재전송'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}
