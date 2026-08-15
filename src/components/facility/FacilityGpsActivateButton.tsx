import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_FONT } from '@/constants/appTheme';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';
import { useThemedColors } from '@/hooks/useThemedColors';

type FacilityGpsActivateButtonProps = {
  active: boolean;
  loading?: boolean;
  onPress: () => void;
};

/** AED · 병원 · 소아 공통 GPS 활성화 버튼 */
export function FacilityGpsActivateButton({
  active,
  loading = false,
  onPress,
}: FacilityGpsActivateButtonProps) {
  const { colors, semantic, status } = useThemedColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: loading }}
      accessibilityLabel="현재 위치 기준으로 보기"
      className="flex-row items-center justify-center rounded-xl border px-4 active:opacity-90"
      style={{
        minHeight: KEMIX_TOUCH_MIN_HEIGHT,
        borderColor: active ? status.gps.border : colors.border,
        backgroundColor: active ? status.gps.bg : colors.surface,
        opacity: loading ? 0.85 : 1,
      }}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={active ? status.gps.icon : semantic.text} />
      ) : (
        <Ionicons
          name="navigate"
          size={18}
          color={active ? status.gps.icon : semantic.subText}
        />
      )}
      <Text
        className="ml-2 text-kemix-text"
        style={{
          fontFamily: APP_FONT.semibold,
          fontSize: 15,
          color: active ? status.gps.fg : semantic.text,
        }}
      >
        {loading ? '위치 확인 중...' : '현재 위치 기준으로 보기'}
      </Text>
      {active && !loading ? (
        <View
          className="ml-2 rounded-full px-2 py-0.5"
          style={{ backgroundColor: status.gps.border }}
        >
          <Text
            style={{
              fontFamily: APP_FONT.bold,
              fontSize: 10,
              color: status.gps.fg,
            }}
          >
            ON
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
