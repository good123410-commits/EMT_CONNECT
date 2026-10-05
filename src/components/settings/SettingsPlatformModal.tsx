import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

type SettingsPlatformModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  /** Web: 설정 시트(10000) 위에 쌓기 */
  webZIndex?: number;
};

/**
 * Web(React 19): RN Modal 포털이 설정 시트·동시 업데이트와 겹치면 렌더가 깨질 수 있어
 * fixed 오버레이를 사용합니다.
 */
export function SettingsPlatformModal({
  visible,
  onClose,
  children,
  animationType = 'slide',
  transparent = false,
  webZIndex = 10050,
}: SettingsPlatformModalProps) {
  if (!visible) {
    return null;
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[styles.webRoot, { zIndex: webZIndex }]}
        accessibilityViewIsModal
      >
        {transparent ? (
          <Pressable
            style={styles.webBackdrop}
            onPress={onClose}
            accessibilityLabel="닫기"
          />
        ) : null}
        <View style={transparent ? styles.webTransparentBody : styles.webFullBody}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
    >
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    flex: 1,
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  webFullBody: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  webTransparentBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
});
