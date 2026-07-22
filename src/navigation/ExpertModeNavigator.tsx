import { useUserRole } from '@/contexts/UserRoleContext';
import { ExpertModeBackHandler } from '@/components/navigation/ExpertModeBackHandler';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { PendingApprovalScreen } from '@/screens/PrivateEmsCallScreen';
import { V1_HIDE_HOSPITAL_CHANNEL } from '@/constants/releaseFlags';
import { isExpertRole } from '@/utils/roleAccess';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HospitalTabNavigator = createDeferredScreen(
  () => require('@/navigation/HospitalTabNavigator').HospitalTabNavigator,
);
const ParamedicTabNavigator = createDeferredScreen(
  () => require('@/navigation/ParamedicTabNavigator').ParamedicTabNavigator,
);
const PrivateEmsTabNavigator = createDeferredScreen(
  () => require('@/navigation/PrivateEmsTabNavigator').PrivateEmsTabNavigator,
);

function ExpertAccessDenied() {
  const { exitExpertMode } = useUserRole();

  return (
    <View className="flex-1 bg-slate-50">
      <ExpertModeBackHandler />
      <SafeAreaView className="flex-1 items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={48} color="#94a3b8" />
        <Text className="mt-4 text-center text-xl font-bold text-slate-900">접근 권한이 없습니다</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
          전문가 모드는 승인된 직군만 이용할 수 있습니다.
        </Text>
        <Text className="mt-6 text-sm font-semibold text-blue-600" onPress={exitExpertMode}>
          일반 모드로 돌아가기
        </Text>
      </SafeAreaView>
    </View>
  );
}

function HospitalChannelDisabledScreen() {
  const { exitExpertMode } = useUserRole();

  return (
    <View className="flex-1 bg-slate-50">
      <ExpertModeBackHandler />
      <SafeAreaView className="flex-1 items-center justify-center px-8">
        <Ionicons name="business-outline" size={48} color="#94a3b8" />
        <Text className="mt-4 text-center text-xl font-bold text-slate-900">병원 관계자 채널</Text>
        <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
          병원 관계자 전용 기능은 v1 출시 범위에서 제외되었습니다.{'\n'}
          응급·의료 정보는 [지도] 탭에서 이용해 주세요.
        </Text>
        <Text className="mt-6 text-sm font-semibold text-blue-600" onPress={exitExpertMode}>
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

  if (role === 'hospital' && V1_HIDE_HOSPITAL_CHANNEL) {
    return <HospitalChannelDisabledScreen />;
  }

  return (
    <>
      <ExpertModeBackHandler />
      {role === 'private_ems' ? <PrivateEmsTabNavigator /> : null}
      {role === 'paramedic' ? <ParamedicTabNavigator /> : null}
      {/*
       * v1 출시 제외 — 병원관계자 탭
       * {role === 'hospital' ? <HospitalTabNavigator /> : null}
       */}
      {!V1_HIDE_HOSPITAL_CHANNEL && role === 'hospital' ? <HospitalTabNavigator /> : null}
    </>
  );
}
