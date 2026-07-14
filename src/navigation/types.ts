import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';

export type RootStackParamList = {
  Loading: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  /** 일반인용 Bottom Tab — 전문가 모드 진입 시 완전 Unmount */
  Main: NavigatorScreenParams<MainTabParamList>;
  /** 승인된 전문가 전용 Root — role별 독립 Tab/Stack Navigator */
  Expert: undefined;
};
