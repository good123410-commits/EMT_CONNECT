import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import type { UtilitiesStackParamList } from '@/navigation/UtilitiesStackNavigator';

export type RootStackParamList = {
  Loading: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  /** 일반인용 Bottom Tab — 전문가 모드 진입 시 완전 Unmount */
  Main: NavigatorScreenParams<MainTabParamList>;
  /** 승인된 전문가 전용 Root — role별 독립 Tab/Stack Navigator */
  Expert: undefined;
  /** 실생활·응급 유틸리티 도구 스택 (모달) */
  Utilities: NavigatorScreenParams<UtilitiesStackParamList>;
  /** 약물정보찾기 (더보기 메뉴) — 탭 바 밖 풀스크린 */
  Chemical: undefined;
  /** 관리자 대시보드 — 설정 모달에서 진입 */
  AdminDashboard: undefined;
};
