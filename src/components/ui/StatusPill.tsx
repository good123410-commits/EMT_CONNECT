import { Text, View, type ViewStyle } from 'react-native';
import { APP_FONT } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

export type StatusPillTone =
  | 'er'
  | 'night'
  | 'open'
  | 'closed'
  | 'info'
  | 'neutral'
  | 'partner'
  | 'moonlight'
  | 'pediatric';

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
};

type PillStyle = { backgroundColor: string; borderColor: string; color: string };

function resolvePillStyle(
  tone: StatusPillTone,
  status: ReturnType<typeof useThemedColors>['status'],
  semantic: ReturnType<typeof useThemedColors>['semantic'],
): PillStyle {
  switch (tone) {
    case 'er':
      return {
        backgroundColor: status.er.bg,
        borderColor: status.er.border,
        color: status.er.fg,
      };
    case 'night':
      return {
        backgroundColor: status.night.bg,
        borderColor: status.night.border,
        color: status.night.fg,
      };
    case 'open':
      return {
        backgroundColor: status.open.bg,
        borderColor: status.open.border,
        color: status.open.fg,
      };
    case 'closed':
      return {
        backgroundColor: status.closed.bg,
        borderColor: status.closed.border,
        color: status.closed.fg,
      };
    case 'info':
    case 'partner':
      return {
        backgroundColor: status.gps.bg,
        borderColor: status.gps.border,
        color: status.gps.fg,
      };
    case 'moonlight':
      return {
        backgroundColor: 'rgba(79, 70, 229, 0.14)',
        borderColor: 'rgba(129, 140, 248, 0.45)',
        color: '#A5B4FC',
      };
    case 'pediatric':
      return {
        backgroundColor: 'rgba(219, 39, 119, 0.12)',
        borderColor: 'rgba(244, 114, 182, 0.4)',
        color: '#F9A8D4',
      };
    default:
      return {
        backgroundColor: semantic.surfaceElevated,
        borderColor: semantic.border,
        color: semantic.subText,
      };
  }
}

/** 공통 상태 배지 — kemix 시맨틱 status 토큰 기반 */
export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const { status, semantic } = useThemedColors();
  const pill = resolvePillStyle(tone, status, semantic);

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: pill.backgroundColor,
    borderColor: pill.borderColor,
  };

  return (
    <View style={containerStyle}>
      <Text
        style={{
          fontFamily: APP_FONT.bold,
          fontSize: 11,
          lineHeight: 14,
          color: pill.color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
