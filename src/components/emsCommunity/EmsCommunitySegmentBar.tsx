import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EMS_COMMUNITY_SEGMENT_OPTIONS, type EmsCommunitySegment } from '@/constants/emsCommunity';
import { APP_COLORS, APP_FONT, APP_RADIUS, APP_SHADOW, APP_SPACING } from '@/constants/appTheme';

type EmsCommunitySegmentBarProps = {
  value: EmsCommunitySegment;
  onChange: (value: EmsCommunitySegment) => void;
};

const activeShadow = StyleSheet.create({
  segment: {
    ...APP_SHADOW.cardSoft,
  },
});

export function EmsCommunitySegmentBar({ value, onChange }: EmsCommunitySegmentBarProps) {
  return (
    <View
      className="bg-kemix-surface"
      style={{
        paddingHorizontal: APP_SPACING.contentHorizontal,
        paddingTop: 8,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: APP_COLORS.border,
      }}
    >
      <View
        className="flex-row p-1"
        style={{
          borderRadius: APP_RADIUS.sm,
          backgroundColor: APP_COLORS.surfaceElevated,
          borderWidth: 1,
          borderColor: APP_COLORS.border,
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
                  backgroundColor: active ? APP_COLORS.surface : 'transparent',
                },
                active ? activeShadow.segment : undefined,
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
                  color: active ? APP_COLORS.textPrimary : APP_COLORS.textSecondary,
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
