import { OPENING_SLIDES } from '../constants/openingSlides';
import type { KemixResource } from '../types';
import {
  ensureKakaoReady,
  isKakaoReadySync,
  isKakaoShareConfigured,
  prepareKakaoShareLayer,
} from './kakaoSdk';

const SHARE_IMAGE_FALLBACK =
  OPENING_SLIDES[1]?.fallback_url ??
  'https://images.unsplash.com/photo-1584433140859-d9baeafe2f6c?w=800&q=80';

export function isKakaoShareAvailable(): boolean {
  return isKakaoShareConfigured();
}

export { isKakaoReadySync };

function buildSharePageUrl(): string {
  return `${window.location.origin}/download/resources`;
}

function invokeKakaoShare(resource: KemixResource): string | null {
  const kakao = window.Kakao;
  if (!kakao?.Share?.sendDefault) {
    return '카카오 공유 모듈을 사용할 수 없습니다.';
  }

  const description =
    resource.description?.trim() ||
    `${resource.file_name} 자료를 KEMIX 자료실에서 확인하세요.`;

  const sharePageUrl = buildSharePageUrl();
  const restoreLayer = prepareKakaoShareLayer();

  try {
    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: resource.title,
        description,
        imageUrl: SHARE_IMAGE_FALLBACK,
        link: {
          mobileWebUrl: sharePageUrl,
          webUrl: sharePageUrl,
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
    console.log('Kakao Share.sendDefault invoked');
  } catch (error) {
    console.error('Kakao Share.sendDefault failed:', error);
    restoreLayer();
    return '카카오톡 공유 요청에 실패했습니다.';
  }

  window.setTimeout(restoreLayer, 3000);
  return null;
}

/**
 * 클릭 이벤트 안에서 동기 호출 (팝업 차단 방지).
 * preload로 미리 ensureKakaoReady()가 끝난 뒤 사용하세요.
 */
export function shareResourceOnKakaoSync(resource: KemixResource): string | null {
  if (!isKakaoReadySync()) {
    return '카카오 공유를 준비 중입니다. 잠시 후 다시 눌러 주세요.';
  }
  return invokeKakaoShare(resource);
}

/** 선로드 실패 시 재시도용 (클릭 핸들러에서는 sync 버전 우선) */
export async function shareResourceOnKakao(resource: KemixResource): Promise<string | null> {
  if (isKakaoReadySync()) {
    return shareResourceOnKakaoSync(resource);
  }

  const setupError = await ensureKakaoReady();
  if (setupError) {
    return setupError;
  }

  return shareResourceOnKakaoSync(resource);
}

export function preloadKakaoSdk(): Promise<string | null> {
  if (!isKakaoShareConfigured()) return Promise.resolve(null);
  return ensureKakaoReady();
}
