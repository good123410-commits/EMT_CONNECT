import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EMS_COMMUNITY_SEGMENT_OPTIONS, type EmsCommunitySegment } from '@/constants/emsCommunity';
import { APP_FONT, APP_RADIUS, APP_SHADOW, APP_SPACING } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

type EmsCommunitySegmentBarProps = {
  value: EmsCommunitySegment;
  onChange: (value: EmsCommunitySegment) => void;
};

export function EmsCommunitySegmentBar({ value, onChange }: EmsCommunitySegmentBarProps) {
  const { colors } = useThemedColors();

  return (
    <View
      className="bg-kemix-surface"
      style={{
        paddingHorizontal: APP_SPACING.contentHorizontal,
        paddingTop: 8,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}
    >
      <View
        className="flex-row p-1"
        style={{
          borderRadius: APP_RADIUS.sm,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {EMS_COMMUNITY_SEGMENT_OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className="flex-1"
              style={[
                {
                  borderRadius: APP_RADIUS.sm - 2,
                  paddingVertical: 11,
                  paddingHorizontal: 6,
                  backgroundColor: active ? colors.surface : 'transparent',
                },
                active ? APP_SHADOW.cardSoft : undefined,
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={{
                  textAlign: 'center',
                  fontFamily: active ? APP_FONT.semibold : APP_FONT.medium,
                  fontSize: 13,
                  lineHeight: 18,
                  color: active ? colors.textPrimary : colors.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
