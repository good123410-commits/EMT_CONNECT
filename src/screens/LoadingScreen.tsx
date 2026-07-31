import { View } from 'react-native';
import { BrandSplashView } from '@/components/intro/BrandSplashView';
import { APP_COLORS } from '@/constants/appTheme';

/** 네비게이션 Loading 스택 — AppLaunchGate 오버레이와 동일한 배경 */
export function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <BrandSplashView showLoadingHint />
    </View>
  );
}
