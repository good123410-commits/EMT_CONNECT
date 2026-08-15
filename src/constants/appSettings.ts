/** 카카오톡 송금 딥링크 — Supabase `settings` fetch 실패 시 사용 */
export const KAKAOTALK_PAY_LINK_FALLBACK = 'kakaotalk://kakaopay/money/send';

/** 딥링크 미지원·카카오톡 미설치 시 웹 안내 */
export const KAKAOTALK_PAY_WEB_FALLBACK = 'https://www.kakaocorp.com/page/service/service/KakaoTalk';

export const KAKAOTALK_APP_STORE_URL = {
  ios: 'https://apps.apple.com/app/id362057947',
  android: 'https://play.google.com/store/apps/details?id=com.kakao.talk',
} as const;

export const COFFEE_SUPPORT_THANKS_MESSAGE =
  '여러분의 응원이 KON을 더 멋지게 만듭니다! 고맙습니다.';
