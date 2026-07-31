import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
} from '@expo-google-fonts/noto-sans-kr';
import { useFonts } from 'expo-font';

/**
 * Pretendard CDN(.otf)는 404로 실패하는 경우가 많아,
 * 번들된 Noto Sans KR을 Pretendard 패밀리명으로 매핑합니다.
 */
export function useAppFonts(): { ready: boolean; loaded: boolean } {
  const [loaded, error] = useFonts({
    Pretendard: NotoSansKR_400Regular,
    'Pretendard-Medium': NotoSansKR_500Medium,
    'Pretendard-SemiBold': NotoSansKR_600SemiBold,
    'Pretendard-Bold': NotoSansKR_700Bold,
  });

  if (error && __DEV__) {
    console.warn('[EMT_CONNECT] 앱 폰트 로드 실패 — 시스템 폰트로 진행합니다.', error);
  }

  return { ready: loaded || Boolean(error), loaded };
}
