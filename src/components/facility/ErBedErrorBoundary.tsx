import type { ReactNode } from 'react';
import { Component, type ErrorInfo } from 'react';
import { Text, View } from 'react-native';
import { useErBedStatusPalette } from '@/constants/erBedTheme';

type ErBedErrorBoundaryProps = {
  children: ReactNode;
  compact?: boolean;
};

type ErBedErrorBoundaryState = {
  hasError: boolean;
};

function ErBedFallback({ compact }: { compact?: boolean }) {
  const palette = useErBedStatusPalette();

  return (
    <View
      className="rounded-xl border border-kemix-border bg-kemix-surface-elevated"
      style={{ padding: compact ? 10 : 12 }}
    >
      <Text
        className="text-xs text-kemix-text-secondary"
        style={{ color: palette.unavailable }}
      >
        현재 실시간 정보 조회 불가
      </Text>
      <Text className="mt-1 text-[11px] leading-4 text-kemix-text-muted">
        잠시 후 다시 시도하거나 119에 문의해 주세요.
      </Text>
    </View>
  );
}

/** 병상 정보 렌더링 전용 에러 바운더리 */
export class ErBedErrorBoundary extends Component<
  ErBedErrorBoundaryProps,
  ErBedErrorBoundaryState
> {
  state: ErBedErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErBedErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn('[ER Bed] render error', error.message, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErBedFallback compact={this.props.compact} />;
    }
    return this.props.children;
  }
}
