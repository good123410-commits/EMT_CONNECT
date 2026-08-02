import { Ionicons } from '@expo/vector-icons';
import { navigateToAdminDashboard } from '@/navigation/settingsNavigation';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';
import { useUserRole } from '@/contexts/UserRoleContext';
import { navigateToMainTab } from '@/navigation/mainTabNavigation';
import { isAdminRole } from '@/utils/roleAccess';
type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsAdminPortalModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, signOut, user } = useAuth();
  const { canOpenOpsAdminPortal } = useExpertSettingsAccess();
  const { opsAdminVerified, verifyOpsAdminCode, clearOpsAdminVerification } = useUserRole();
  const [code, setCode] = useState('');

  const dbAdmin = isAdminRole(profile?.role ?? 'user') && (profile?.is_approved ?? false);
  const hasAccess = canOpenOpsAdminPortal;

  const handleVerify = () => {
    const ok = verifyOpsAdminCode(code);
    if (ok) {
      Alert.alert('인증 완료', '관리자 모드가 활성화되었습니다.');
      setCode('');
      return;
    }
    Alert.alert('인증 실패', '관리자 비밀코드가 올바르지 않습니다.');
  };

  const handleOpenDashboard = () => {
    onClose();
    navigateToAdminDashboard();
  };

  const handleOpenParamedicSpace = () => {
    onClose();
    navigateToMainTab('Paramedic');
  };

  const handleClearSession = () => {
    clearOpsAdminVerification();
    Alert.alert('세션 종료', '관리자 모드 인증이 해제되었습니다.');
  };

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          onClose();
          void signOut();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-kemix-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-bold text-kemix-text">관리자 모드</Text>
            <Text className="mt-0.5 text-xs text-kemix-text-secondary">Q&A 운영 · 질문 현황 모니터링</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10 gap-4">
          {hasAccess ? (
            <View className="gap-3">
              <View className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <Text className="text-sm font-bold text-violet-900">
                  {dbAdmin ? '승인된 관리자 계정' : '운영 관리자 인증됨'}
                </Text>
                <Text className="mt-1 text-xs leading-5 text-violet-800">
                  관리자 대시보드와 구급대원 전용 공간에 접근할 수 있습니다.
                </Text>
              </View>

              <Pressable
                className="flex-row items-center justify-between rounded-2xl border border-green-200 bg-green-700 px-4 py-3.5 active:bg-green-800"
                onPress={handleOpenParamedicSpace}
              >
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={20} color="#fff" />
                  <Text className="ml-2 font-bold text-white">구급대원 전용 공간 열기</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#bbf7d0" />
              </Pressable>

              <Pressable
                className="flex-row items-center justify-between rounded-2xl border border-violet-200 bg-violet-700 px-4 py-3.5 active:bg-violet-800"
                onPress={handleOpenDashboard}
              >
                <View className="flex-row items-center">
                  <Ionicons name="grid-outline" size={20} color="#fff" />
                  <Text className="ml-2 font-bold text-white">관리자 대시보드 입장</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ddd6fe" />
              </Pressable>

              {opsAdminVerified && !dbAdmin ? (
                <Pressable
                  className="items-center rounded-xl border border-kemix-border py-3 active:bg-kemix-bg"
                  onPress={handleClearSession}
                >
                  <Text className="text-sm font-semibold text-kemix-text-secondary">관리자 인증 해제</Text>
                </Pressable>
              ) : null}

              {user ? (
                <Pressable
                  className="flex-row items-center justify-center rounded-xl border border-kemix-border py-3 active:bg-kemix-bg"
                  onPress={handleSignOut}
                >
                  <Ionicons name="log-out-outline" size={18} color="#64748b" />
                  <Text className="ml-2 text-sm font-semibold text-kemix-text-secondary">로그아웃</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-5">
              <Text className="text-sm leading-6 text-kemix-text-secondary">
                운영 관리자 비밀코드를 입력하면 Q&A 대시보드와 구급대원 전용 공간에 접근할 수
                있습니다.
                {'\n\n'}승인된 관리자 계정은 별도 코드 없이 자동으로 입장됩니다.
              </Text>

              <TextInput
                className="mt-4 rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                value={code}
                onChangeText={setCode}
                placeholder="관리자 비밀코드"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <Pressable
                className="mt-4 items-center rounded-xl bg-violet-700 py-3.5 active:bg-violet-800"
                onPress={handleVerify}
              >
                <Text className="font-bold text-white">인증하고 입장</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
