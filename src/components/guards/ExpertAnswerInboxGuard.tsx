import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import type { SettingsStackParamList } from '@/navigation/SettingsStackNavigator';
import { canAccessExpertAnswerInbox } from '@/utils/expertSettingsAccess';

type Props = {
  children: ReactNode;
};

/** 답변함 화면 최상단 권한 재검증 — URL/딥링크 우회 방어 */
export function ExpertAnswerInboxGuard({ children }: Props) {
  const { profile } = useAuth();
  const { opsAdminVerified } = useUserRole();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const role = profile?.role ?? 'user';
  const isApproved = profile?.is_approved ?? false;
  const allowed = canAccessExpertAnswerInbox(role, isApproved, opsAdminVerified);

  if (!allowed) {
    return (
      <View className="flex-1 bg-slate-50">
        <SafeAreaView className="flex-1 px-6">
          <Pressable className="mb-4 flex-row items-center" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
            <Text className="ml-2 font-semibold text-slate-700">설정</Text>
          </Pressable>
          <View className="flex-1 items-center justify-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="lock-closed-outline" size={32} color="#dc2626" />
            </View>
            <Text className="text-center text-lg font-bold text-slate-900">접근 권한 없음</Text>
            <Text className="mt-3 text-center text-sm leading-6 text-slate-600">
              승인된 구급대원 또는 관리자 계정만 전문가 답변함에 접근할 수 있습니다.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return <>{children}</>;
}
