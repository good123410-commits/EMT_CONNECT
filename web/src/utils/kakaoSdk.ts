const KAKAO_SDK_URL =
  'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

let initSucceeded = false;

/** Vite 빌드 시 주입 — 공백·따옴표 제거 */
export function getKakaoJsKey(): string {
  const raw = import.meta.env.VITE_KAKAO_JS_KEY;
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/^['"]|['"]$/g, '');
}

const kakaoKeyAtLoad = getKakaoJsKey();
console.log('Kakao Key Loaded:', kakaoKeyAtLoad || '(empty)');

function isKakaoScriptReady(): boolean {
  return typeof window.Kakao?.init === 'function';
}

function ensureKakaoScriptInDom(): void {
  if (document.querySelector('script[data-kakao-sdk]')) return;

  const script = document.createElement('script');
  script.src = KAKAO_SDK_URL;
  script.crossOrigin = 'anonymous';
  script.async = true;
  script.dataset.kakaoSdk = 'true';
  document.head.appendChild(script);
}

/**
 * SDK 스크립트 로드 대기.
 * 주의: Kakao.Share 는 init() 호출 후에만 붙습니다 — 여기서는 Kakao.init 만 확인합니다.
 */
export function waitForKakaoSdk(timeoutMs = 15000): Promise<NonNullable<Window['Kakao']>> {
  ensureKakaoScriptInDom();

  return new Promise((resolve, reject) => {
    const started = Date.now();

    const tick = () => {
      if (isKakaoScriptReady()) {
        resolve(window.Kakao!);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error('Kakao SDK load timeout'));
        return;
      }
      window.setTimeout(tick, 50);
    };

    tick();
  });
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
      return '카카오 SDK를 불러오지 못했습니다. 네트워크·광고 차단을 확인한 뒤 페이지를 새로고침해 주세요.';
    case 'init':
      return '카카오 SDK 초기화에 실패했습니다. VITE_KAKAO_JS_KEY와 카카오 개발자 콘솔의 JavaScript 키·도메인 등록을 확인하세요.';
    default:
      return '카카오 공유를 사용할 수 없습니다.';
  }
}

function initKakaoSdk(kakao: NonNullable<Window['Kakao']>, key: string): boolean {
  try {
    if (!kakao.isInitialized()) {
      kakao.init(key);
    }
    const ready = kakao.isInitialized() && Boolean(kakao.Share?.sendDefault);
    console.log('Kakao SDK initialized:', ready);
    return ready;
  } catch (error) {
    console.error('Kakao SDK init failed:', error);
    return false;
  }
}

/** SDK 로드 + init — 성공 시 null, 실패 시 사용자 메시지 */
export async function ensureKakaoReady(): Promise<string | null> {
  const key = getKakaoJsKey();
  if (!key) {
    return getKakaoUnavailableReason('key');
  }

  if (initSucceeded && window.Kakao?.Share?.sendDefault) {
    return null;
  }

  let kakao: NonNullable<Window['Kakao']>;
  try {
    kakao = await waitForKakaoSdk();
  } catch (error) {
    console.error('Kakao SDK wait failed:', error);
    return getKakaoUnavailableReason('sdk');
  }

  initSucceeded = initKakaoSdk(kakao, key);

  if (!initSucceeded) {
    return getKakaoUnavailableReason('init');
  }

  return null;
}

/** 동기 판별 — 클릭 핸들러에서 await 없이 공유 호출 가능 여부 */
export function isKakaoReadySync(): boolean {
  return initSucceeded && Boolean(window.Kakao?.Share?.sendDefault);
}

/** 앱 시작 시 SDK 선로드 */
export function preloadKakaoSdk(): Promise<string | null> {
  if (!isKakaoShareConfigured()) return Promise.resolve(null);
  return ensureKakaoReady();
}

/** 카카오 공유 피커가 모달 뒤에 가려지지 않도록 일시 조정 */
export function prepareKakaoShareLayer(): () => void {
  document.body.classList.add('kakao-share-active');
  return () => {
    document.body.classList.remove('kakao-share-active');
  };
}
