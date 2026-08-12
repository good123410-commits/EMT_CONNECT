import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useThemedColors } from '@/hooks/useThemedColors';

type ThemedScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  className?: string;
};

/**
 * 화면 루트 — 테마 배경·CSS 변수를 보장하는 공통 래퍼.
 * `bg-kemix-*` / `text-kemix-*` Tailwind 클래스와 함께 사용.
 */
export function ThemedScreen({ children, style, className = 'flex-1' }: ThemedScreenProps) {
  const { colors } = useThemedColors();

  return (
    <View className={className} style={[{ backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
}
