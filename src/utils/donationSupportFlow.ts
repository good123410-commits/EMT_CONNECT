import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';
import type { DonationAccount } from '@/services/donationService';
import { openKakaoTalkPayLink } from '@/utils/kakaoTalkPayLink';

const COPY_SUCCESS_MESSAGE = '계좌번호가 복사되었습니다! 이제 카카오페이 앱으로 이동합니다.';

export async function copyDonationAccountAndOpenKakaoPay(
  account: DonationAccount,
  kakaoTalkPayLink: string,
): Promise<void> {
  const accountNumber = account.account_number.trim();
  if (!accountNumber) {
    Alert.alert('오류', '유효한 계좌번호가 없습니다.');
    return;
  }

  await Clipboard.setStringAsync(accountNumber);

  Alert.alert('후원해 주셔서 감사합니다', COPY_SUCCESS_MESSAGE);

  setTimeout(() => {
    void openKakaoTalkPayLink(kakaoTalkPayLink);
  }, 400);
}
