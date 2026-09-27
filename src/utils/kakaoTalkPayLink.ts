import { Linking, Platform } from 'react-native';
import {
  KAKAOTALK_APP_STORE_URL,
  KAKAOTALK_PAY_LINK_FALLBACK,
  KAKAOTALK_PAY_WEB_FALLBACK,
} from '@/constants/appSettings';

function resolveStoreUrl(): string {
  return Platform.OS === 'ios' ? KAKAOTALK_APP_STORE_URL.ios : KAKAOTALK_APP_STORE_URL.android;
}

/**
 * 카카오페이 송금 딥링크를 연다. 실패 시 앱스토어 → 웹 안내 순으로 폴백한다.
 * @returns 앱/딥링크 오픈 성공 여부
 */
export async function openKakaoTalkPayLink(link?: string | null): Promise<boolean> {
  const deepLink = link?.trim() || KAKAOTALK_PAY_LINK_FALLBACK;

  try {
    await Linking.openURL(deepLink);
    return true;
  } catch {
    // canOpenURL은 iOS에서 스킴 미등록 시 false — openURL 직접 시도 후 폴백
  }

  if (Platform.OS === 'ios') {
    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
        return true;
      }
    } catch {
      // fall through
    }
  }

  const storeUrl = resolveStoreUrl();
  try {
    await Linking.openURL(storeUrl);
    return true;
  } catch {
    // fall through
  }

  try {
    await Linking.openURL(KAKAOTALK_PAY_WEB_FALLBACK);
    return true;
  } catch {
    return false;
  }
}
