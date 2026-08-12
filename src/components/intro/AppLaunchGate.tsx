import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { BrandSplashView } from '@/components/intro/BrandSplashView';
import { useThemedColors } from '@/hooks/useThemedColors';

/** 로고 애니메이션 완료 후 메인 전환 전 추가 유지 시간 */
const POST_READY_HOLD_MS = 700;
const FADE_OUT_MS = 500;

type AppLaunchGateProps = {
  children: ReactNode;
};

/**
 * 앱 초기화(폰트·인증) 동안 브랜드 스플래시를 유지하고 메인으로 페이드 아웃.
 */
export function AppLaunchGate({ children }: AppLaunchGateProps) {
  const { loading } = useAuth();
  const { colors } = useThemedColors();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [logoAnimDone, setLogoAnimDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading || !logoAnimDone) return undefined;

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setOverlayVisible(false);
      });
    }, POST_READY_HOLD_MS);

    return () => clearTimeout(timer);
  }, [loading, logoAnimDone, opacity]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {children}
      {overlayVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            { opacity, backgroundColor: colors.background },
          ]}
        >
          <BrandSplashView
            showLoadingHint={loading}
            onLogoAnimationComplete={() => setLogoAnimDone(true)}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    zIndex: 9999,
  },
});
