import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { APP_COLORS } from '@/constants/appTheme';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[EMT_CONNECT] startup error:', error.message, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-kemix-surface px-6">
          <Text className="mb-2 text-lg font-bold text-kemix-text">앱 실행 오류</Text>
          <ScrollView className="mb-4 max-h-48 w-full rounded-xl bg-kemix-bg p-3">
            <Text className="text-xs text-kemix-text-secondary">{this.state.error.message}</Text>
          </ScrollView>
          <Pressable
            className="rounded-kemix-sm px-6 py-4"
            style={{ backgroundColor: APP_COLORS.blue }}
            onPress={this.handleRetry}
          >
            <Text className="font-bold text-white">다시 시도</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
