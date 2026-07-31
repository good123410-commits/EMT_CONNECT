import { Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_COLORS, APP_RADIUS, APP_SHADOW } from '@/constants/appTheme';

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const activeShadow = StyleSheet.create({
  segment: {
    ...APP_SHADOW.cardSoft,
  },
});

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentControlProps<T>) {
  return (
    <View
      className="flex-row p-1.5"
      style={{
        borderRadius: APP_RADIUS.sm,
        backgroundColor: APP_COLORS.surfaceElevated,
        borderWidth: 1,
        borderColor: APP_COLORS.border,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            className="flex-1"
            style={[
              {
                borderRadius: APP_RADIUS.sm - 2,
                paddingVertical: 12,
                paddingHorizontal: 8,
                backgroundColor: active ? APP_COLORS.surface : 'transparent',
              },
              active ? activeShadow.segment : undefined,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              className="text-center text-sm"
              style={{
                fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
                color: active ? APP_COLORS.textPrimary : APP_COLORS.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
