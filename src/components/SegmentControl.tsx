import { Pressable, View, Text } from 'react-native';
import { APP_RADIUS, APP_SHADOW } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentControlProps<T>) {
  const { colors } = useThemedColors();

  return (
    <View
      className="flex-row p-1.5"
      style={{
        borderRadius: APP_RADIUS.sm,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            className="flex-1"
            style={[
              {
                borderRadius: APP_RADIUS.sm - 2,
                minHeight: KEMIX_TOUCH_MIN_HEIGHT,
                paddingVertical: 10,
                paddingHorizontal: 8,
                justifyContent: 'center',
                backgroundColor: active ? colors.surface : 'transparent',
              },
              active ? APP_SHADOW.cardSoft : undefined,
            ]}
            onPress={() => onChange(option.value)}

          >
            <Text
              className="text-center text-sm"
              style={{
                fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
                color: active ? colors.textPrimary : colors.textSecondary,
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
