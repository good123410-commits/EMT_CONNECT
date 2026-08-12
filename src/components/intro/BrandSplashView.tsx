import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BRAND_ON_SUBTITLE, BRAND_ON_TITLE } from '@/constants/branding';
import { APP_FONT } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

const APP_LOGO = require('../../../assets/ic_launcher.png');

/** 최종 로고 표시 크기 */
const LOGO_DISPLAY_SIZE = 152;
/** 애니메이션 시작 스케일 — 박스 없이 화면 중앙에서 크게 시작 */
const LOGO_START_SCALE = 0.78;
const LOGO_ANIMATION_MS = 950;
const TEXT_FADE_MS = 550;

type BrandSplashViewProps = {
  showLoadingHint?: boolean;
  style?: StyleProp<ViewStyle>;
  /** 로고 스케일 업 애니메이션 완료 콜백 */
  onLogoAnimationComplete?: () => void;
  /** false면 정적 로고 (오프닝 재생 모달 등) */
  animateLogo?: boolean;
};

/** 앱 로고 + K-EMIX On 브랜드 스플래시 (다크 모드) */
export function BrandSplashView({
  showLoadingHint = false,
  style,
  onLogoAnimationComplete,
  animateLogo = true,
}: BrandSplashViewProps) {
  const { colors } = useThemedColors();
  const logoScale = useRef(new Animated.Value(LOGO_START_SCALE)).current;
  const logoTranslateY = useRef(new Animated.Value(14)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!animateLogo) {
      logoScale.setValue(1);
      logoTranslateY.setValue(0);
      textOpacity.setValue(1);
      textTranslateY.setValue(0);
      onLogoAnimationComplete?.();
      return undefined;
    }

    const scaleAnim = Animated.timing(logoScale, {
      toValue: 1,
      duration: LOGO_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const floatAnim = Animated.timing(logoTranslateY, {
      toValue: 0,
      duration: LOGO_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const textAnim = Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: TEXT_FADE_MS,
        delay: LOGO_ANIMATION_MS - 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: TEXT_FADE_MS,
        delay: LOGO_ANIMATION_MS - 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([scaleAnim, floatAnim]).start(({ finished }) => {
      if (finished) onLogoAnimationComplete?.();
    });
    textAnim.start();

    return () => {
      scaleAnim.stop();
      floatAnim.stop();
      textAnim.stop();
    };
  }, [
    animateLogo,
    logoScale,
    logoTranslateY,
    onLogoAnimationComplete,
    textOpacity,
    textTranslateY,
  ]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <View style={styles.centerBlock}>
        <Animated.Image
          source={APP_LOGO}
          style={[
            styles.logo,
            {
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="K-EMIX 앱 로고"
        />

        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{BRAND_ON_TITLE}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{BRAND_ON_SUBTITLE}</Text>
        </Animated.View>

        {showLoadingHint ? (
          <Text style={[styles.loadingHint, { color: colors.textMuted }]}>초기화 중…</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerBlock: {
    alignItems: 'center',
    maxWidth: 320,
  },
  logo: {
    width: LOGO_DISPLAY_SIZE,
    height: LOGO_DISPLAY_SIZE,
    marginBottom: 28,
  },
  title: {
    fontFamily: APP_FONT.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontFamily: APP_FONT.regular,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  loadingHint: {
    marginTop: 28,
    fontFamily: APP_FONT.medium,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
