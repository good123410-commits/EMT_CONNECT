import { BrandSplashView } from '@/components/intro/BrandSplashView';
import { ThemedScreen } from '@/components/theme/ThemedScreen';

/** 네비게이션 Loading 스택 — AppLaunchGate 오버레이와 동일한 배경 */
export function LoadingScreen() {
  return (
    <ThemedScreen>
      <BrandSplashView showLoadingHint />
    </ThemedScreen>
  );
}
