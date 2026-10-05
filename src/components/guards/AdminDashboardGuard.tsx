import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { useUserRole } from '@/contexts/UserRoleContext';
import { navigationRef } from '@/navigation/navigationRef';
import { isApprovedDbAdmin } from '@/utils/expertSettingsAccess';

type Props = {
  children: ReactNode;
};

/**
 * auth.uid() + user_profiles 실시간 조회로 DB 관리자 여부를 확인합니다.
 * 대시보드 진입은 로그인 + (DB admin 또는 운영 비밀코드) 조건을 만족해야 합니다.
 */
export function AdminDashboardGuard({ children }: Props) {
  const { loading: authLoading, profile } = useAuth();
  const { opsAdminVerified } = useUserRole();
  const { isDbAdmin, loading: profileLoading, reload } = useLiveDbAdmin();

  const authProfileAdmin = profile
    ? isApprovedDbAdmin(profile.role, profile.is_approved)
    : false;
  const canEnterDashboard = isDbAdmin || authProfileAdmin || opsAdminVerified;
  const checking =
    authLoading || (profileLoading && !authProfileAdmin && !opsAdminVerified);

  useEffect(() => {
    void reload();
  }, [reload, opsAdminVerified]);

  const deniedHandledRef = useRef(false);

  useEffect(() => {
    if (checking || canEnterDashboard) {
      deniedHandledRef.current = false;
      return;
    }
    if (deniedHandledRef.current) return;
    deniedHandledRef.current = true;

    Alert.alert(
      '관리자 대시보드',
      '승인된 DB 관리자 계정이거나, 설정에서 운영 관리자 비밀코드 인증이 필요합니다.',
      [
        {
          text: '확인',
          onPress: () => {
            if (navigationRef.isReady() && navigationRef.canGoBack()) {
              navigationRef.goBack();
            }
          },
        },
      ],
    );
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
      <View className="flex-1 items-center justify-center bg-kemix-bg px-6">
        <Text className="text-center text-sm text-kemix-text-secondary">
          관리자 권한이 없습니다. 설정에서 운영 비밀코드로 인증하거나 승인된 관리자 계정으로 로그인해 주세요.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
