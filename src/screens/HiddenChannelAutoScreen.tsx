import { useUserRole } from '@/contexts/UserRoleContext';
import { HospitalDashboardScreen } from '@/screens/dashboard/HospitalDashboardScreen';
import { ParamedicDashboardScreen } from '@/screens/dashboard/ParamedicDashboardScreen';
import { PrivateEmsDashboardScreen } from '@/screens/dashboard/PrivateEmsDashboardScreen';
import { PendingApprovalScreen } from '@/screens/PrivateEmsCallScreen';
import { isExpertRole } from '@/utils/roleAccess';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function HiddenAccessDenied() {
  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1 items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={48} color="#94a3b8" />
        <Text className="mt-4 text-center text-xl font-bold text-slate-900">접근 권한이 없습니다</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
          히든 채널은 승인된 전문가(응급구조사·병원·사설구급차)만 이용할 수 있습니다.
        </Text>
      </SafeAreaView>
    </View>
  );
}

/**
 * [히든 채널] 탭 진입 시 role + is_approved를 자동 판별하여
 * 수동 선택 없이 해당 직군 전용 화면으로 즉시 다이렉트
 */
export function HiddenChannelAutoScreen() {
  const { role, isApproved } = useUserRole();

  if (!isExpertRole(role)) {
    return <HiddenAccessDenied />;
  }

  if (!isApproved) {
    return <PendingApprovalScreen />;
  }

  switch (role) {
    case 'paramedic':
      return <ParamedicDashboardScreen />;
    case 'private_ems':
      return <PrivateEmsDashboardScreen />;
    case 'hospital':
      return <HospitalDashboardScreen />;
    default:
      return <HiddenAccessDenied />;
  }
}
