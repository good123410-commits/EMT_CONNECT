import { View } from 'react-native';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';

/** 메인 하단 탭 (글로벌 FAB는 MoreMenuProvider 오버레이) */
export function MainTabShell() {
  return (
    <View className="flex-1">
      <MainTabNavigator />
    </View>
  );
}
