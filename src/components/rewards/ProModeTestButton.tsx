import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';

export function ProModeTestButton() {
  const { profile } = useAuth();
  const { setRole, isProUser, isDevOverride } = useUserRole();
  const serverRole = profile?.role ?? 'public';

  return (
    <View className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <View className="flex-row items-center">
        <Ionicons name="flask" size={18} color="#64748b" />
        <Text className="ml-2 text-sm font-bold text-slate-700">개발 테스트</Text>
      </View>
      <Text className="mt-2 text-xs leading-5 text-slate-500">
        개발 빌드 전용: 로컬 UI 테스트용 역할 오버라이드입니다.
        {'\n'}서버 역할: {serverRole}
        {isDevOverride ? ' · UI 오버라이드 적용 중' : ''}
      </Text>
      <Pressable
        className={`mt-3 flex-row items-center justify-center rounded-xl py-3 ${isProUser ? 'bg-orange-600' : 'bg-slate-900'}`}
        onPress={() => setRole(isProUser ? 'public' : 'emt_certified')}
      >
        <Ionicons
          name={isProUser ? 'eye-off-outline' : 'shield-checkmark-outline'}
          size={18}
          color="#fff"
        />
        <Text className="ml-2 text-sm font-bold text-white">
          {isProUser ? '일반인 모드로 전환' : 'PRO 모드 전환 (테스트)'}
        </Text>
      </Pressable>
    </View>
  );
}
