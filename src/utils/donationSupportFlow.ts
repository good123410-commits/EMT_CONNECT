import * as Clipboard from 'expo-clipboard';
import { Alert, Platform } from 'react-native';
import type { DonationAccount } from '@/services/donationService';
import { openKakaoTalkPayLink } from '@/utils/kakaoTalkPayLink';

/** 카카오페이 송금 입력란 붙여넣기용 (하이픈 제거) */
export function normalizeDonationAccountNumber(accountNumber: string): string {
  const trimmed = accountNumber.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 8 ? digitsOnly : trimmed;
}

export type DonationSupportFlowResult = {
  copied: boolean;
  openedKakaoPay: boolean;
};

/**
 * 계좌번호 클립보드 복사 후 카카오페이(카카오톡) 앱으로 이동합니다.
 */
export async function copyDonationAccountAndOpenKakaoPay(
  account: DonationAccount,
  kakaoTalkPayLink: string,
): Promise<DonationSupportFlowResult> {
  const accountNumber = normalizeDonationAccountNumber(account.account_number);
  if (!accountNumber) {
    Alert.alert('오류', '유효한 계좌번호가 없습니다.');
    return { copied: false, openedKakaoPay: false };
  }

  await Clipboard.setStringAsync(accountNumber);

  const openedKakaoPay = await openKakaoTalkPayLink(kakaoTalkPayLink);

  if (Platform.OS === 'web') {
    Alert.alert(
      '계좌번호 복사됨',
      openedKakaoPay
        ? '계좌번호가 복사되었습니다. 카카오페이로 이동합니다.'
        : '계좌번호가 복사되었습니다. 모바일 카카오톡·카카오페이 앱에서 송금해 주세요.',
    );
  } else if (!openedKakaoPay) {
    Alert.alert(
      '계좌번호 복사됨',
      '계좌번호는 복사되었습니다. 카카오톡이 설치되어 있는지 확인한 뒤, 카카오페이 송금에서 붙여넣기 해 주세요.',
    );
  }

  return { copied: true, openedKakaoPay };
}
