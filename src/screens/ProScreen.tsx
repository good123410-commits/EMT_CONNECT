import { Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export function ProScreen() {
  const { profile } = useAuth();

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-8">
      <View className="rounded-2xl border border-slate-200 bg-white p-6">
        <Text className="text-2xl font-bold text-slate-900">PRO 전용 공간</Text>
        <Text className="mt-3 text-base leading-6 text-slate-600">
          인증된 응급구조사만 접근할 수 있는 폐쇄형 커뮤니티입니다.
        </Text>
        {profile ? (
          <View className="mt-4 rounded-xl bg-slate-50 p-4">
            <Text className="text-sm text-slate-500">인증 회원</Text>
            <Text className="text-base font-semibold text-slate-900">
              {profile.name ?? '응급구조사'}
            </Text>
            <Text className="mt-1 text-xs text-green-600">
              role: {profile.role} · approved: {profile.is_approved ? 'Y' : 'N'}
            </Text>
          </View>
        ) : null}
        <Text className="mt-6 text-sm text-slate-400">
          추후 전문 게시판, 공동구매, 정책 설문 등 PRO 기능이 이곳에 추가됩니다.
        </Text>
      </View>
    </View>
  );
}
