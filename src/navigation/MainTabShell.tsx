import { View } from 'react-native';
import { MoreMenuFloatingButton } from '@/components/utilities/MoreMenuFloatingButton';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';

/** 6개 하단 탭 + 플로팅 더보기 버튼 */
export function MainTabShell() {
  return (
    <View className="flex-1">
      <MainTabNavigator />
      <MoreMenuFloatingButton />
    </View>
  );
}
