import type { ComponentType, ReactNode } from 'react';
import { Component } from 'react';
import { Text, View } from 'react-native';

type MapModuleErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
};

type ErrorBoundaryState = { error: Error | null };

/** MapView 네이티브 크래시 시 리스트·검색 UI는 유지 */
export class MapModuleErrorBoundary extends Component<
  MapModuleErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-kemix-elevated px-6">
          <Text className="mb-2 text-sm font-bold text-kemix-text">
            {this.props.title ?? '지도를 표시할 수 없습니다'}
          </Text>
          <Text className="text-center text-xs leading-5 text-kemix-text-secondary">
            Google Maps API 키가 없거나 기기 지도 서비스를 사용할 수 없습니다. 목록에서 시설을
            확인해 주세요.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export function withMapModuleBoundary<P extends object>(
  Component: ComponentType<P>,
  title?: string,
): ComponentType<P> {
  return function WrappedMapModule(props: P) {
    return (
      <MapModuleErrorBoundary title={title}>
        <Component {...props} />
      </MapModuleErrorBoundary>
    );
  };
}
