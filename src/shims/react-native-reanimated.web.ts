/**
 * Web: react-native-reanimated JSI/UpdatePropsManager 미지원.
 * 네이티브 전용 코드가 web 번들에 끼어 들어도 크래시하지 않도록 no-op API 제공.
 */
import type { ComponentType } from 'react';
import { View } from 'react-native';

function createAnimatedComponent<T extends ComponentType<unknown>>(Component: T): T {
  return Component;
}

const Animated = {
  View,
  createAnimatedComponent,
};

export default Animated;

export { Animated };

export function useSharedValue<T>(initial: T): { value: T } {
  return { value: initial };
}

export function useAnimatedStyle(_factory: () => Record<string, unknown>): Record<string, unknown> {
  return {};
}

export function useFrameCallback(_callback: (frame: { timeSincePreviousFrame?: number }) => void): void {
  return;
}

export function useDerivedValue<T>(_factory: () => T): { value: T } {
  return { value: undefined as T };
}

export function withSpring<T>(toValue: T): T {
  return toValue;
}

export function withTiming<T>(toValue: T): T {
  return toValue;
}

export function withSequence<T>(...values: T[]): T {
  return values[0];
}

export function cancelAnimation(_sharedValue?: unknown): void {
  return;
}

export function runOnJS<Fn extends (...args: never[]) => unknown>(fn: Fn): Fn {
  return fn;
}

export const FadeInUp = { duration: () => ({}) };
export const FadeOutDown = { duration: () => ({}) };

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  inOut: (_: unknown) => (t: number) => t,
};
