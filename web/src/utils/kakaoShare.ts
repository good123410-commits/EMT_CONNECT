import type { KemixResource } from '../types';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;

let initAttempted = false;

function ensureKakaoInit(): boolean {
  if (!KAKAO_JS_KEY || !window.Kakao) return false;
  if (!initAttempted) {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
    initAttempted = true;
  }
  return window.Kakao.isInitialized();
}

export function isKakaoShareAvailable(): boolean {
  return Boolean(KAKAO_JS_KEY);
}

export function shareResourceOnKakao(resource: KemixResource): string | null {
  if (!ensureKakaoInit()) {
    return '카카오 공유가 설정되지 않았습니다. (VITE_KAKAO_JS_KEY)';
  }

  const description =
    resource.description?.trim() ||
    `${resource.file_name} 자료를 KEMIX 자료실에서 확인하세요.`;

  window.Kakao!.Share.sendDefault({
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

  return null;
}
