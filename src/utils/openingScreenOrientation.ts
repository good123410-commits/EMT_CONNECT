import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

/** 오프닝 몽타주 진입 시 가로 모드 고정 */
export async function lockOpeningLandscape(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  } catch {
    // 시뮬레이터·미지원 환경 무시
  }
}

/** 오프닝 종료 후 앱 기본 세로 모드 복구 */
export async function restoreOpeningPortrait(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  } catch {
    // 시뮬레이터·미지원 환경 무시
  }
}
