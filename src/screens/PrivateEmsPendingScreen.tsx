import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { getRoleLabel } from '@/utils/roleAccess';

export function PendingApprovalScreen({ onBack }: { onBack?: () => void }) {
  const { profile, signOut, refreshProfile } = useAuth();
  const { role } = useUserRole();
  const [refreshing, setRefreshing] = useState(false);

  useHardwareBackHandler(() => {
    if (onBack) {
      onBack();
      return true;
    }
    return false;
  }, Boolean(onBack));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-kemix-bg">
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <Ionicons name="hourglass-outline" size={40} color="#d97706" />
          </View>
          <Text className="text-center text-2xl font-bold text-kemix-text">승인 대기 중</Text>
          <Text className="mt-3 text-center text-base leading-6 text-kemix-text-secondary">
            관리자의 가입 승인을 대기 중입니다.{'\n'}
            {getRoleLabel(role)} 계정은 승인 후 전용 채널에 접근할 수 있습니다.
          </Text>
          {profile ? (
            <View className="mt-6 w-full rounded-2xl border border-kemix-border bg-kemix-surface p-4">
              <Text className="text-sm text-kemix-text-secondary">신청 정보</Text>
              <Text className="mt-1 text-base font-semibold text-kemix-text">
                {profile.name ?? '이름 미입력'}
              </Text>
              <Text className="text-sm text-kemix-text-secondary">{profile.email}</Text>
              <Text className="mt-1 text-xs text-kemix-muted">
                역할: {getRoleLabel(profile.role)}
                {profile.invitation_code ? ` · 코드: ${profile.invitation_code}` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          className={`mb-3 items-center rounded-xl py-4 ${refreshing ? 'bg-slate-400' : 'bg-slate-900'}`}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-bold text-white">승인 상태 새로고침</Text>
          )}
        </Pressable>
        {onBack ? (
          <Pressable className="mb-3 items-center rounded-xl border border-kemix-border py-4" onPress={onBack}>
            <Text className="font-semibold text-kemix-text">일반 모드로 돌아가기</Text>
          </Pressable>
        ) : null}
        <Pressable className="mb-8 items-center rounded-xl border border-kemix-border py-4" onPress={signOut}>
          <Text className="font-semibold text-kemix-text">로그아웃</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
