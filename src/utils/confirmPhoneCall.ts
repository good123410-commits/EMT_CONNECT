import { Alert, Linking, Platform } from 'react-native';

function normalizeTelUri(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.length >= 7 ? digits : null;
}

export function confirmPhoneCall(facilityName: string, phone: string | undefined | null): void {
  const trimmed = phone?.trim();
  if (!trimmed || trimmed === '-') return;

  const tel = normalizeTelUri(trimmed);
  if (!tel) return;

  const displayName = facilityName.trim() || '해당 시설';
  const message = `${displayName}에 통화하시겠습니까?`;

  const openTel = () => {
    void Linking.openURL(`tel:${tel}`);
  };

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(message)) {
      window.location.href = `tel:${tel}`;
    }
    return;
  }

  Alert.alert('전화 연결', message, [
    { text: '아니오', style: 'cancel' },
    { text: '예', onPress: openTel },
  ]);
}
