// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export function EmergencyOverlayBootstrap() { return null; }

/*
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { loadEmergencyContactCard } from '@/services/emergencyContactStorage';
import {
  bootstrapEmergencyOverlay,
  loadEmergencyOverlayState,
  markOverlayPermissionPrompted,
  requestOverlayPermissionFlow,
  wasOverlayPermissionPrompted,
} from '@/services/emergencyOverlayService';

/** 앱 시작 시 오버레이 동기화 + Android 최초 권한 안내 *\/
export function EmergencyOverlayBootstrap() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void (async () => {
      const card = await loadEmergencyContactCard();
      await bootstrapEmergencyOverlay(card);

      const prompted = await wasOverlayPermissionPrompted();
      if (prompted) return;

      const overlayState = await loadEmergencyOverlayState();
      if (!overlayState.supported) return;
      if (overlayState.hasPermission) {
        await markOverlayPermissionPrompted();
        return;
      }

      Alert.alert(
        '잠금화면 응급 정보',
        '「다른 앱 위에 표시」 권한을 허용하면 화면이 켜질 때 비상 연락망·응급 의료 정보가 즉시 표시됩니다. 설정 또는 홈에서 기능을 켤 수 있습니다.',
        [
          {
            text: '나중에',
            style: 'cancel',
            onPress: () => {
              void markOverlayPermissionPrompted();
            },
          },
          {
            text: '권한 설정',
            onPress: () => {
              void requestOverlayPermissionFlow();
            },
          },
        ],
      );
    })();
  }, []);

  return null;
}

*/
