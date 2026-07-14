import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-2 text-lg font-bold text-slate-900">앱 실행 오류</Text>
          <ScrollView className="mb-4 max-h-48 w-full rounded-xl bg-slate-50 p-3">
            <Text className="text-xs text-slate-600">{this.state.error.message}</Text>
          </ScrollView>
          <Pressable className="rounded-xl bg-red-600 px-5 py-3" onPress={this.handleRetry}>
            <Text className="font-bold text-white">다시 시도</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
