// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export function useEmergencyOverlay() {
  return {
    state: { supported: false, enabled: false, hasPermission: false },
    loading: false,
    refresh: async () => ({ supported: false, enabled: false, hasPermission: false }),
    enableOverlay: async () => false,
    disableOverlay: async () => {},
    toggleOverlay: async () => {},
    ensurePermission: async () => false,
  };
}

/*
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';import { loadEmergencyContactCard } from '@/services/emergencyContactStorage';
import {
  disableEmergencyOverlay,
  enableEmergencyOverlay,
  loadEmergencyOverlayState,
  requestOverlayPermissionFlow,
  type EmergencyOverlayState,
} from '@/services/emergencyOverlayService';

export function useEmergencyOverlay() {
  const [state, setState] = useState<EmergencyOverlayState>({
    supported: false,
    enabled: false,
    hasPermission: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await loadEmergencyOverlayState();
    setState(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    const current = await refresh();
    if (!current.supported) return false;
    if (current.hasPermission) return true;
    await requestOverlayPermissionFlow();
    const after = await refresh();
    return after.hasPermission;
  }, [refresh]);

  const enableOverlay = useCallback(async (): Promise<boolean> => {
    const card = await loadEmergencyContactCard();
    const permitted = await ensurePermission();
    if (!permitted) {
      Alert.alert(
        '권한 필요',
        '「다른 앱 위에 표시」 권한을 허용해야 잠금화면 오버레이를 사용할 수 있습니다.',
      );
      return false;
    }

    const result = await enableEmergencyOverlay(card);
    if (!result.ok) {
      if (result.reason === 'no_content') {
        Alert.alert('정보 필요', '비상 연락망 정보를 먼저 등록해 주세요.');
      }
      await refresh();
      return false;
    }

    await refresh();
    Alert.alert('적용 완료', '화면이 켜질 때 응급 정보가 상단에 표시됩니다.');
    return true;
  }, [ensurePermission, refresh]);

  const disableOverlay = useCallback(async () => {
    await disableEmergencyOverlay();
    await refresh();
    Alert.alert('해제 완료', '잠금화면 오버레이가 비활성화되었습니다.');
  }, [refresh]);

  const toggleOverlay = useCallback(async () => {
    if (state.enabled) {
      await disableOverlay();
    } else {
      await enableOverlay();
    }
  }, [state.enabled, disableOverlay, enableOverlay]);

  return {
    state,
    loading,
    refresh,
    enableOverlay,
    disableOverlay,
    toggleOverlay,
    ensurePermission,
  };
}

*/
