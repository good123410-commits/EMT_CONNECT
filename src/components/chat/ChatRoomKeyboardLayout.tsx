import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View, type ViewStyle } from 'react-native';

type ChatRoomKeyboardLayoutProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  /**
   * 네비게이션 헤더 등 KeyboardAvoidingView 바깥 고정 chrome 높이.
   * 채팅 자체 헤더는 `header` 슬롯에 두므로 기본 0.
   */
  keyboardVerticalOffset?: number;
};

export function ChatRoomKeyboardLayout({
  header,
  footer,
  children,
  backgroundColor,
  style,
  keyboardVerticalOffset = 0,
}: ChatRoomKeyboardLayoutProps) {
  return (
    <View className="flex-1" style={[{ backgroundColor }, style]}>
      {header}
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardVerticalOffset : 0}
      >
        <View className="min-h-0 flex-1">
          {children}
          {footer}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
