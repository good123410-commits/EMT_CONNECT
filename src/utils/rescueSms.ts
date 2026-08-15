import { Alert, Linking, Platform } from 'react-native';
import type { GeoCoordinate } from '@/services/locationService';

export type RescueLocationSnapshot = {
  coordinate: GeoCoordinate | null;
  address: string | null;
};

/** 119 조난·구조 요청 문자 본문 */
export function buildRescue119SmsMessage(location: RescueLocationSnapshot): string {
  const address = location.address?.trim() || '주소 확인 중';
  const lat = location.coordinate?.latitude;
  const lng = location.coordinate?.longitude;

  const coordText =
    typeof lat === 'number' && typeof lng === 'number'
      ? `(위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)})`
      : '(좌표 확인 중)';

  return `조난/구조 요청! 현재 내 위치는 ${address} ${coordText}입니다. 구조를 부탁드립니다.`;
}

function buildSmsUrl(phone: string, body: string): string {
  const dial = phone.replace(/[^\d+]/g, '') || '119';
  const separator = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${dial}${separator}body=${encodeURIComponent(body)}`;
}

/** 119 문자 신고 앱 열기 */
export async function openRescue119Sms(location: RescueLocationSnapshot): Promise<void> {
  const body = buildRescue119SmsMessage(location);
  const url = buildSmsUrl('119', body);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (!canOpen) {
    Alert.alert('문자 전송 불가', '이 기기에서 문자 앱을 열 수 없습니다.');
    return;
  }

  await Linking.openURL(url);
}
