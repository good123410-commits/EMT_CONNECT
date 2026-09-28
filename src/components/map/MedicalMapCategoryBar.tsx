import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_FONT } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { MedicalMapTab } from '@/types/medicalMap';

const TAB_BORDER_RADIUS = 10;

const MAP_CATEGORY_OPTIONS: { value: MedicalMapTab; label: string }[] = [
  { value: 'aed', label: 'AED' },
  { value: 'er', label: '병원' },
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
              style={[
                styles.tabButton,
                {
                  backgroundColor: active ? colors.blue : colors.surfaceElevated,
                  borderColor: colors.border,
                  borderWidth: active ? 0 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: active ? APP_FONT.semibold : APP_FONT.medium,
                  fontSize: 13,
                  lineHeight: 18,
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

const styles = StyleSheet.create({
  tabButton: {
    minWidth: 56,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: TAB_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
