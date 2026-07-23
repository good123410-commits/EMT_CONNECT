const KAKAO_SDK_URL =
  'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
const KAKAO_SDK_INTEGRITY =
  'sha384-DKYJZ8NLiK8MN4c5vVk/8/YJtwpHGvN9MOjk+ErT670HcH0jc0P8jPJJJy9/fbyl';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: (() => boolean) | boolean;
      Share?: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;
let initAttempted = false;
let initSucceeded = false;

/** Vite 빌드 시 주입 — 공백·따옴표 제거 */
export function getKakaoJsKey(): string {
  const raw = import.meta.env.VITE_KAKAO_JS_KEY;
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
}

const kakaoKeyAtLoad = getKakaoJsKey();
console.log('Kakao Key Loaded:', kakaoKeyAtLoad || '(empty)');

function readIsInitialized(kakao: NonNullable<Window['Kakao']>): boolean {
  const state = kakao.isInitialized;
  if (typeof state === 'function') {
    try {
      return state.call(kakao);
    } catch {
      return false;
    }
  }
  if (typeof state === 'boolean') {
    return state;
  }
  return false;
}

function isKakaoSdkUsable(kakao: NonNullable<Window['Kakao']>): boolean {
  return Boolean(kakao.Share?.sendDefault) && (initSucceeded || readIsInitialized(kakao));
}

export function waitForKakaoSdk(timeoutMs = 8000): Promise<NonNullable<Window['Kakao']>> {
  if (window.Kakao?.Share) {
    return Promise.resolve(window.Kakao);
  }

  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk]');
      if (existing) {
        if (window.Kakao?.Share) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Kakao SDK script load failed')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.src = KAKAO_SDK_URL;
      script.integrity = KAKAO_SDK_INTEGRITY;
      script.crossOrigin = 'anonymous';
      script.dataset.kakaoSdk = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Kakao SDK script load failed'));
      document.head.appendChild(script);
    });
  }

  return sdkLoadPromise.then(
    () =>
      new Promise((resolve, reject) => {
        const started = Date.now();
        const poll = () => {
          if (window.Kakao?.Share) {
            resolve(window.Kakao);
            return;
          }
          if (Date.now() - started >= timeoutMs) {
            reject(new Error('Kakao SDK load timeout'));
            return;
          }
          window.setTimeout(poll, 50);
        };
        poll();
      }),
  );
}

export function isKakaoShareConfigured(): boolean {
  return kakaoKeyAtLoad.length > 0;
}

export function getKakaoUnavailableReason(
  phase: 'key' | 'sdk' | 'init',
): string {
  switch (phase) {
    case 'key':
      return '카카오 JavaScript 키가 설정되지 않았습니다. web/.env 또는 프로젝트 루트 .env의 VITE_KAKAO_JS_KEY를 확인한 뒤 dev 서버를 재시작하세요.';
    case 'sdk':
      return '카카오 SDK를 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
    case 'init':
      return '카카오 SDK 초기화에 실패했습니다. VITE_KAKAO_JS_KEY와 카카오 개발자 콘솔의 JavaScript 키·도메인 등록을 확인하세요.';
    default:
      return '카카오 공유를 사용할 수 없습니다.';
  }
}

/** SDK 로드 + init — 성공 시 null, 실패 시 사용자 메시지 */
export async function ensureKakaoReady(): Promise<string | null> {
  const key = getKakaoJsKey();
  if (!key) {
    return getKakaoUnavailableReason('key');
  }

  let kakao: NonNullable<Window['Kakao']>;
  try {
    kakao = await waitForKakaoSdk();
  } catch {
    return getKakaoUnavailableReason('sdk');
  }

  if (!initAttempted) {
    initAttempted = true;
    try {
      if (!readIsInitialized(kakao)) {
        kakao.init(key);
      }
      initSucceeded = isKakaoSdkUsable(kakao) || readIsInitialized(kakao);
      if (!initSucceeded && kakao.Share?.sendDefault) {
        // isInitialized()가 false여도 Share 모듈이 있으면 사용 가능한 경우가 있음
        initSucceeded = true;
      }
    } catch (error) {
      console.error('Kakao SDK init failed:', error);
      initSucceeded = false;
    }
  }

  if (!initSucceeded && !isKakaoSdkUsable(kakao)) {
    return getKakaoUnavailableReason('init');
  }

  return null;
}

/** 앱 시작 시 SDK 선로드 (공유 버튼 클릭 전 초기화) */
export function preloadKakaoSdk(): void {
  if (!isKakaoShareConfigured()) return;
  void ensureKakaoReady().catch((error) => {
    console.warn('Kakao SDK preload skipped:', error);
  });
}
