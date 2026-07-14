import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useUserRole } from '@/contexts/UserRoleContext';

/**
 * [히든] 탭 fallback — 탭 버튼이 enterExpertMode()를 호출하지만
 * 혹시 화면이 마운트되면 즉시 전문가 Root로 전환을 재시도합니다.
 */
export function HiddenChannelEntryScreen() {
  const { enterExpertMode, isExpert } = useUserRole();

  useEffect(() => {
    if (isExpert) {
      enterExpertMode();
    }
  }, [enterExpertMode, isExpert]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <ActivityIndicator size="large" color="#7c3aed" />
    </View>
  );
}
