import type { KemixResource } from '../types';
import {
  ensureKakaoReady,
  isKakaoShareConfigured,
  preloadKakaoSdk,
} from './kakaoSdk';

export { preloadKakaoSdk };

export function isKakaoShareAvailable(): boolean {
  return isKakaoShareConfigured();
}

export async function shareResourceOnKakao(resource: KemixResource): Promise<string | null> {
  const setupError = await ensureKakaoReady();
  if (setupError) {
    return setupError;
  }

  const kakao = window.Kakao;
  if (!kakao?.Share?.sendDefault) {
    return '카카오 공유 모듈을 사용할 수 없습니다.';
  }

  const description =
    resource.description?.trim() ||
    `${resource.file_name} 자료를 KEMIX 자료실에서 확인하세요.`;

  try {
    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: resource.title,
        description,
        imageUrl: `${window.location.origin}/favicon.ico`,
        link: {
          mobileWebUrl: resource.file_url,
          webUrl: resource.file_url,
        },
      },
      buttons: [
        {
          title: '자료 다운로드',
          link: {
            mobileWebUrl: resource.file_url,
            webUrl: resource.file_url,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Kakao Share.sendDefault failed:', error);
    return '카카오톡 공유 요청에 실패했습니다.';
  }

  return null;
}
