import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import {
  APP_THEME_DESCRIPTIONS,
  APP_THEME_LABELS,
  type AppThemeMode,
} from '@/constants/appThemes';
import { useAppTheme } from '@/contexts/AppThemeContext';

const THEME_OPTIONS: AppThemeMode[] = ['light', 'dark', 'beige'];

const THEME_ICONS: Record<AppThemeMode, keyof typeof Ionicons.glyphMap> = {
  light: 'sunny-outline',
  dark: 'moon-outline',
  beige: 'cafe-outline',
};

export function ThemePickerSection() {
  const { mode, setMode, colors } = useAppTheme();

  return (
    <View>
      <Text
        className="mb-2 px-1 text-xs font-bold uppercase tracking-wide"
        style={{ color: colors.textMuted }}
      >
        화면 테마
      </Text>
      <View
        className="overflow-hidden rounded-2xl border"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {THEME_OPTIONS.map((option, index) => {
          const active = mode === option;
          return (
            <Pressable
              key={option}
              className="flex-row items-center px-4 py-4 active:opacity-90"
              style={
                index < THEME_OPTIONS.length - 1
                  ? { borderBottomWidth: 1, borderBottomColor: colors.borderLight }
                  : undefined
              }
              onPress={() => setMode(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={THEME_ICONS[option]}
                size={22}
                color={active ? colors.blue : colors.textSecondary}
              />
              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-medium"
                  style={{ color: active ? colors.textPrimary : colors.textSecondary }}
                >
                  {APP_THEME_LABELS[option]} 모드
                </Text>
                <Text className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
                  {APP_THEME_DESCRIPTIONS[option]}
                </Text>
              </View>
              <View
                className="h-5 w-5 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: active ? colors.blue : colors.border,
                  backgroundColor: active ? colors.blue : 'transparent',
                }}
              >
                {active ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
