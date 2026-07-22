import { CommonActions } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { useUserRole } from '@/contexts/UserRoleContext';
import { navigationRef } from '@/navigation/navigationRef';

type Props = {
  children: ReactNode;
};

function redirectToHome() {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            state: {
              routes: [{ name: 'Home' }],
              index: 0,
            },
          },
        ],
      }),
    );
    return;
  }

  const interval = setInterval(() => {
    if (navigationRef.isReady()) {
      clearInterval(interval);
      redirectToHome();
    }
  }, 100);
}

/**
 * auth.uid() + user_profiles 실시간 조회로 DB 관리자 여부를 확인합니다.
 * 대시보드 진입은 로그인 + (DB admin 또는 운영 비밀코드) 조건을 만족해야 합니다.
 */
export function AdminDashboardGuard({ children }: Props) {
  const { loading: authLoading } = useAuth();
  const { opsAdminVerified } = useUserRole();
  const { isDbAdmin, loading: profileLoading, reload } = useLiveDbAdmin();

  const checking = authLoading || profileLoading;
  const canEnterDashboard = isDbAdmin || opsAdminVerified;

  useEffect(() => {
    void reload();
  }, [reload, opsAdminVerified]);

  useEffect(() => {
    if (!checking && !canEnterDashboard) {
      redirectToHome();
    }
  }, [checking, canEnterDashboard]);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#7c3aed" />
        <Text className="mt-3 text-sm text-slate-500">관리자 권한 확인 중...</Text>
      </View>
    );
  }

  if (!canEnterDashboard) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return <>{children}</>;
}
