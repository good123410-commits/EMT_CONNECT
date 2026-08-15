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
 * 카카오페이 딥링크를 연다. 실패 시 앱스토어 → 웹 안내 순으로 폴백한다.
 */
export async function openKakaoTalkPayLink(link?: string | null): Promise<void> {
  const deepLink = link?.trim() || KAKAOTALK_PAY_LINK_FALLBACK;

  try {
    const canOpen = await Linking.canOpenURL(deepLink);
    if (canOpen) {
      await Linking.openURL(deepLink);
      return;
    }
  } catch {
    // fall through to store / web
  }

  const storeUrl = resolveStoreUrl();
  try {
    const canOpenStore = await Linking.canOpenURL(storeUrl);
    if (canOpenStore) {
      await Linking.openURL(storeUrl);
      return;
    }
  } catch {
    // fall through
  }

  await Linking.openURL(KAKAOTALK_PAY_WEB_FALLBACK).catch(() => undefined);
}
