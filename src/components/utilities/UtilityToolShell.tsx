import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import { APP_SPACING } from '@/constants/appTheme';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';

type UtilityToolShellProps = {
  children: ReactNode;
};

/** 유틸 스택 — 글로벌 헤더 아래 콘텐츠 영역 */
export function UtilityToolShell({ children }: UtilityToolShellProps) {
  const fabBottomInset = useGlobalFabBottomInset();

  return (
    <ThemedScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: APP_SPACING.screen,
          paddingTop: 16,
          paddingBottom: fabBottomInset,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </ThemedScreen>
  );
}
