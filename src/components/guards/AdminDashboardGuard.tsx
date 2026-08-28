import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { useUserRole } from '@/contexts/UserRoleContext';
import { resetNavigationToHome } from '@/navigation/goHome';

type Props = {
  children: ReactNode;
};

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
      resetNavigationToHome();
    }
  }, [checking, canEnterDashboard]);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-kemix-bg">
        <ActivityIndicator color="#7c3aed" />
        <Text className="mt-3 text-sm text-kemix-text-secondary">관리자 권한 확인 중...</Text>
      </View>
    );
  }

  if (!canEnterDashboard) {
    return (
      <View className="flex-1 items-center justify-center bg-kemix-bg">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return <>{children}</>;
}
