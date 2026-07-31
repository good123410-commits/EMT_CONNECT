import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_BORDER, APP_COLORS, APP_SPACING } from '@/constants/appTheme';
import { closeUtilitiesStack } from '@/navigation/utilityNavigation';

type UtilityToolShellProps = {
  children: ReactNode;
};

/** 유틸 스택 — 닫기 버튼만 있는 미니멀 셸 */
export function UtilityToolShell({ children }: UtilityToolShellProps) {
  return (
    <View className="flex-1" style={{ backgroundColor: APP_COLORS.background }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: APP_COLORS.surface, ...APP_BORDER.card }}>
        <View className="flex-row items-center" style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
            style={{
              backgroundColor: APP_COLORS.surfaceElevated,
              borderWidth: 1,
              borderColor: APP_COLORS.border,
            }}
            onPress={closeUtilitiesStack}
            hitSlop={8}
          >
            <AppIcon name="close" size={20} color={APP_COLORS.textSecondary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: APP_SPACING.screen,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
