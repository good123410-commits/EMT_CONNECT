import { Pressable, ScrollView, Text, View } from 'react-native';
import { APP_FONT } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { MedicalMapTab } from '@/types/medicalMap';

const MAP_CATEGORY_OPTIONS: { value: MedicalMapTab; label: string }[] = [
  { value: 'aed', label: 'AED' },
  { value: 'er', label: '응급실' },
  { value: 'pediatric', label: '소아' },
  { value: 'pharmacy', label: '약국' },
  { value: 'shelter', label: '쉼터' },
  { value: 'privateEms', label: '민간구급차' },
];

type MedicalMapCategoryBarProps = {
  value: MedicalMapTab;
  onChange: (value: MedicalMapTab) => void;
};

export function MedicalMapCategoryBar({ value, onChange }: MedicalMapCategoryBarProps) {
  const { colors } = useThemedColors();

  return (
    <View className="bg-kemix-surface pb-2 pt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {MAP_CATEGORY_OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: active ? colors.blue : colors.surfaceElevated,
                borderWidth: active ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: active ? APP_FONT.semibold : APP_FONT.medium,
                  fontSize: 13,
                  color: active ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
