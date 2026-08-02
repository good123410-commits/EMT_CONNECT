// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export function EmergencyOverlayToggleCard() { return null; }

/*
﻿import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, Pressable, Switch, Text, View } from 'react-native';
import { APP_COLORS, APP_RADIUS, APP_SHADOW } from '@/constants/appTheme';
import { useEmergencyOverlay } from '@/hooks/useEmergencyOverlay';

type EmergencyOverlayToggleCardProps = {
  compact?: boolean;
};

export function EmergencyOverlayToggleCard({ compact = false }: EmergencyOverlayToggleCardProps) {
  const { state, loading, toggleOverlay, ensurePermission } = useEmergencyOverlay();

  if (Platform.OS !== 'android') {
    if (compact) return null;
    return (
      <View className="rounded-xl border border-kemix-border bg-kemix-bg p-4">
        <Text className="text-sm text-kemix-text-secondary">
          잠금화면 오버레이는 Android에서만 지원됩니다. iOS는 더보기에서 비상 연락망 카드를
          이용해 주세요.
        </Text>
      </View>
    );
  }

  if (!state.supported) {
    return null;
  }

  const handlePermission = () => {
    void ensurePermission();
  };

  return (
    <View
      style={{
        borderRadius: APP_RADIUS.card,
        borderWidth: 1,
        borderColor: state.enabled ? '#FECACA' : APP_COLORS.borderLight,
        backgroundColor: state.enabled ? '#FEF2F2' : APP_COLORS.surface,
        padding: compact ? 14 : 16,
        ...APP_SHADOW.cardSoft,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center">
            <Ionicons name="phone-portrait-outline" size={18} color="#DC2626" />
            <Text className="ml-2 text-sm font-bold text-kemix-text">잠금화면 오버레이</Text>
          </View>
          <Text className="mt-1 text-[11px] leading-4 text-kemix-text-secondary">
            화면이 켜질 때 비상 연락망·응급 정보를 최상단에 표시
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={APP_COLORS.blue} />
        ) : (
          <Switch
            value={state.enabled}
            onValueChange={() => void toggleOverlay()}
            trackColor={{ false: '#E2E8F0', true: '#FCA5A5' }}
            thumbColor={state.enabled ? '#DC2626' : '#F8FAFC'}
          />
        )}
      </View>

      {!state.hasPermission ? (
        <Pressable
          className="mt-3 flex-row items-center justify-center rounded-lg border border-red-200 bg-kemix-surface py-2.5 active:bg-red-50"
          onPress={handlePermission}
        >
          <Ionicons name="shield-checkmark-outline" size={16} color="#DC2626" />
          <Text className="ml-1.5 text-xs font-semibold text-red-700">
            다른 앱 위에 표시 권한 허용
          </Text>
        </Pressable>
      ) : null}

      {state.enabled ? (
        <Text className="mt-2 text-[10px] leading-4 text-red-700">
          활성화 중 · 화면 ON 시 오버레이 표시 · 잠금 해제 또는 닫기로 숨김
        </Text>
      ) : null}
    </View>
  );
}

*/
