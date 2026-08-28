import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandSplashView } from '@/components/intro/BrandSplashView';
import { APP_FONT } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

const AUTO_DISMISS_MS = 2800;
const EXIT_MS = 450;
const CONTROL_HIT_SLOP = { top: 20, bottom: 20, left: 24, right: 24 };

type Phase = 'visible' | 'exit' | 'finished';

type AppOpeningOverlayProps = {
  visible: boolean;
  onComplete: (options: { hideForDay: boolean }) => void;
};

/** 설정 > 오프닝 다시 보기 · 수동 재생용 브랜드 오프닝 */
export function AppOpeningOverlay({ visible, onComplete }: AppOpeningOverlayProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemedColors();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finishedRef = useRef(false);
  const hideForDayRef = useRef(false);
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;

  const [phase, setPhase] = useState<Phase>('visible');
  const [hideForDay, setHideForDay] = useState(false);

  const finishIntro = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase('finished');
    onCompleteRef.current({ hideForDay: hideForDayRef.current });
  }, []);

  const runExitAnimation = useCallback(
    (onEnd?: () => void) => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onEnd?.();
      });
    },
    [containerOpacity],
  );

  const dismiss = useCallback(() => {
    if (finishedRef.current) return;
    setPhase('exit');
    runExitAnimation(finishIntro);
  }, [finishIntro, runExitAnimation]);

  useEffect(() => {
    hideForDayRef.current = hideForDay;
  }, [hideForDay]);

  useEffect(() => {
    if (!visible) return undefined;

    finishedRef.current = false;
    hideForDayRef.current = false;
    setHideForDay(false);
    setPhase('visible');
    containerOpacity.setValue(0);
    contentOpacity.setValue(0);
    contentTranslateY.setValue(12);

    const enter = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        delay: 120,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    enter.start();

    const autoTimer = setTimeout(() => dismiss(), AUTO_DISMISS_MS);

    return () => {
      enter.stop();
      clearTimeout(autoTimer);
    };
  }, [
    visible,
    containerOpacity,
    contentOpacity,
    contentTranslateY,
    dismiss,
  ]);

  if (!visible || phase === 'finished') return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.root, { opacity: containerOpacity, backgroundColor: colors.background }]}>
        <Animated.View
          style={[
            styles.contentWrap,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <BrandSplashView animateLogo />
        </Animated.View>

        <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="오늘 하루 보지 않기"
            accessibilityState={{ checked: hideForDay }}
            hitSlop={CONTROL_HIT_SLOP}
            onPress={() => setHideForDay((prev) => !prev)}
            style={styles.hideForDayBtn}
          >
            <View
              style={[
                styles.hideForDayCheck,
                { borderColor: colors.border },
                hideForDay && { backgroundColor: colors.blue, borderColor: colors.blue },
              ]}
            >
              {hideForDay ? (
                <Text style={[styles.hideForDayMark, { color: colors.textPrimary }]}>✓</Text>
              ) : null}
            </View>
            <Text style={[styles.hideForDayText, { color: colors.textSecondary }]}>
              오늘 하루 보지 않기
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="건너뛰기"
            hitSlop={CONTROL_HIT_SLOP}
            onPress={dismiss}
            style={[
              styles.skipBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
          >
            <Text style={[styles.skipText, { color: colors.textPrimary }]}>건너뛰기</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: 24,
    gap: 12,
    alignItems: 'center',
  },
  skipBtn: {
    minWidth: 200,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: APP_FONT.semibold,
    fontSize: 15,
  },
  hideForDayBtn: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  hideForDayCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideForDayMark: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
  hideForDayText: {
    fontFamily: APP_FONT.medium,
    fontSize: 13,
  },
});
