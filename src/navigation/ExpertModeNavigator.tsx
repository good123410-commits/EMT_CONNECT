import { useUserRole } from '@/contexts/UserRoleContext';
import { ExpertModeBackHandler } from '@/components/navigation/ExpertModeBackHandler';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { PendingApprovalScreen } from '@/screens/PrivateEmsCallScreen';
import { isExpertRole } from '@/utils/roleAccess';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_COLORS } from '@/constants/appTheme';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ParamedicTabNavigator = createDeferredScreen(
  () => require('@/navigation/ParamedicTabNavigator').ParamedicTabNavigator,
);

function ExpertAccessDenied() {
  const { exitExpertMode } = useUserRole();

  return (
    <View className="flex-1 bg-kemix-bg">
      <ExpertModeBackHandler />
      <SafeAreaView className="flex-1 items-center justify-center px-8">
        <AppIcon name="lock-outline" size={48} color={APP_COLORS.textMuted} />
        <Text className="mt-4 text-center text-xl font-bold text-kemix-text">접근 권한이 없습니다</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-kemix-text-secondary">
          전문가 모드는 승인된 준회원·정회원만 이용할 수 있습니다.
        </Text>
        <Text
          className="mt-6 text-sm font-semibold"
          style={{ color: APP_COLORS.blue }}
          onPress={exitExpertMode}
        >
          일반 모드로 돌아가기
        </Text>
      </SafeAreaView>
    </View>
  );
}

export function ExpertModeNavigator() {
  const { role, isApproved, exitExpertMode } = useUserRole();

  if (!isExpertRole(role)) {
    return <ExpertAccessDenied />;
  }

  if (!isApproved) {
    return (
      <>
        <ExpertModeBackHandler />
        <PendingApprovalScreen onBack={exitExpertMode} />
      </>
    );
  }

  return (
    <>
      <ExpertModeBackHandler />
      <ParamedicTabNavigator />
    </>
  );
}
