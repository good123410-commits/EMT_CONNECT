import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Text, View } from 'react-native';
import { useThemedColors } from '@/hooks/useThemedColors';
import {
  getLocationWithRegion,
  getLocationWithRegionImmediate,
  type GeoCoordinate,
} from '@/services/locationService';
import { acquireEmergencyLocation } from '@/utils/emergencySms';
import { openRescue119Sms } from '@/utils/rescueSms';

type LocationState = {
  coordinate: GeoCoordinate | null;
  address: string | null;
  loading: boolean;
  error: string | null;
};

type LocationRescueProps = {
  /** 홈 화면용 컴팩트 레이아웃 */
  variant?: 'default' | 'home';
  /** 119 문자 신고 버튼 표시 (홈에서는 숨김) */
  showSmsButton?: boolean;
};

function formatCoordinate(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(6) : '—';
}

/** 현재 위치 표시 + (선택) 119 문자 신고 */
export function LocationRescue({
  variant = 'default',
  showSmsButton = true,
}: LocationRescueProps) {
  const { colors } = useThemedColors();
  const [location, setLocation] = useState<LocationState>(() => {
    const snapshot = getLocationWithRegionImmediate();
    return {
      coordinate: snapshot.coordinate,
      address: snapshot.region.label || null,
      loading: true,
      error: null,
    };
  });
  const [smsOpening, setSmsOpening] = useState(false);

  const refreshLocation = useCallback(async () => {
    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [regionSnapshot, emergencySnapshot] = await Promise.all([
        getLocationWithRegion(),
        acquireEmergencyLocation(),
      ]);

      const coordinate = emergencySnapshot.coordinate ?? regionSnapshot.coordinate;
      const address =
        emergencySnapshot.address?.trim() ||
        regionSnapshot.region.label?.trim() ||
        null;

      setLocation({
        coordinate,
        address,
        loading: false,
        error: null,
      });
    } catch {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: '위치를 가져오지 못했습니다. GPS를 켜고 다시 시도해 주세요.',
      }));
    }
  }, []);

  useEffect(() => {
    void refreshLocation();
  }, [refreshLocation]);

  const handleSmsPress = async () => {
    setSmsOpening(true);
    try {
      await openRescue119Sms({
        coordinate: location.coordinate,
        address: location.address,
      });
    } finally {
      setSmsOpening(false);
    }
  };

  const isHome = variant === 'home';

  return (
    <View>
      {!isHome ? (
        <>
          <Text className="mb-1 text-lg font-bold text-kemix-text" style={{ color: colors.textPrimary }}>
            내 위치 확인
          </Text>
          <Text className="mb-4 text-sm leading-5 text-kemix-text-secondary">
            GPS와 역지오코딩으로 현재 위치를 표시합니다. 비상 시 119로 위치가 포함된 문자를 보낼 수
            있습니다.
          </Text>
        </>
      ) : null}

      <View
        className="rounded-2xl border p-5"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        {location.loading ? (
          <View className="items-center py-6">
            <ActivityIndicator color={colors.blue} size="large" />
            <Text className="mt-3 text-sm text-kemix-text-secondary">위치 확인 중…</Text>
          </View>
        ) : (
          <>
            <View className="mb-4 flex-row items-start gap-3">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: `${colors.blue}22` }}
              >
                <Ionicons name="location" size={22} color={colors.blue} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs uppercase tracking-wide text-kemix-text-muted"
                  style={{ fontFamily: 'Pretendard-SemiBold' }}
                >
                  현재 주소
                </Text>
                <Text
                  className="mt-1 text-xl leading-8 text-kemix-text"
                  style={{ fontFamily: 'Pretendard-Bold', color: colors.textPrimary }}
                >
                  {location.address || '주소를 확인할 수 없습니다'}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View
                className="flex-1 rounded-xl px-4 py-3"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-xs text-kemix-text-muted">위도</Text>
                <Text
                  className="mt-1 text-lg text-kemix-text"
                  style={{ fontFamily: 'Pretendard-Bold' }}
                >
                  {formatCoordinate(location.coordinate?.latitude)}
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl px-4 py-3"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-xs text-kemix-text-muted">경도</Text>
                <Text
                  className="mt-1 text-lg text-kemix-text"
                  style={{ fontFamily: 'Pretendard-Bold' }}
                >
                  {formatCoordinate(location.coordinate?.longitude)}
                </Text>
              </View>
            </View>
          </>
        )}

        {location.error ? (
          <Text className="mt-3 text-sm text-red-500">{location.error}</Text>
        ) : null}

        <Pressable
          className="mt-4 flex-row items-center justify-center rounded-xl py-3 active:opacity-90"
          style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
          onPress={() => void refreshLocation()}
          disabled={location.loading}
        >
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          <Text className="ml-2 text-sm font-semibold text-kemix-text-secondary">위치 새로고침</Text>
        </Pressable>
      </View>

      {showSmsButton ? (
        <>
          <Pressable
            className="mt-5 overflow-hidden rounded-2xl bg-red-600 active:bg-red-700"
            disabled={smsOpening || location.loading}
            onPress={() => void handleSmsPress()}
          >
            <View className="flex-row items-center justify-center px-4 py-4">
              {smsOpening ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="chatbox-ellipses" size={22} color="#fff" />
                  <Text className="ml-2 text-base font-bold text-white">119로 문자 신고하기</Text>
                </>
              )}
            </View>
          </Pressable>

          <Text className="mt-3 text-center text-xs leading-5 text-kemix-text-muted">
            버튼을 누르면 문자 앱이 열리며 위치 정보가 자동 입력됩니다.
          </Text>
        </>
      ) : null}
    </View>
  );
}
