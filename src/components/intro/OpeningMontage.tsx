import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_FULL_NAME } from '@/constants/branding';
import { OpeningGuideImages } from '@/components/intro/OpeningGuideImages';

const EXIT_MS = 450;
const CONTROL_HIT_SLOP = { top: 20, bottom: 20, left: 24, right: 24 };

type Phase = 'visible' | 'exit' | 'finished';

type OpeningMontageProps = {
  visible: boolean;
  onComplete: (options: { hideForDay: boolean }) => void;
};

export function OpeningMontage({ visible, onComplete }: OpeningMontageProps) {
  const insets = useSafeAreaInsets();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finishedRef = useRef(false);
  const hideForDayRef = useRef(false);
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const typographyOpacity = useRef(new Animated.Value(0)).current;
  const typographyTranslateY = useRef(new Animated.Value(16)).current;

  const [phase, setPhase] = useState<Phase>('visible');
  const [hideForDay, setHideForDay] = useState(false);

  const finishIntro = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase('finished');
    onCompleteRef.current({ hideForDay: hideForDayRef.current });
  }, []);

  const runExitAnimation = useCallback(
    (duration = EXIT_MS, onEnd?: () => void) => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onEnd?.();
      });
    },
    [containerOpacity],
  );

  const skipIntro = useCallback(() => {
    if (finishedRef.current) return;
    setPhase('exit');
    runExitAnimation(EXIT_MS, finishIntro);
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
    containerOpacity.setValue(1);
    typographyOpacity.setValue(0);
    typographyTranslateY.setValue(16);

    const reveal = Animated.parallel([
      Animated.timing(typographyOpacity, {
        toValue: 1,
        duration: 700,
        delay: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(typographyTranslateY, {
        toValue: 0,
        duration: 700,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    reveal.start();

    return () => {
      reveal.stop();
    };
  }, [visible, containerOpacity, typographyOpacity, typographyTranslateY]);

  if (!visible || phase === 'finished') return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.root, { opacity: containerOpacity }]}>
        <View style={styles.topHalf}>
          <OpeningGuideImages />
        </View>

        <View style={[styles.bottomHalf, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Animated.View
            style={[
              styles.typographyBlock,
              {
                opacity: typographyOpacity,
                transform: [{ translateY: typographyTranslateY }],
              },
            ]}
          >
            <Text style={styles.revealEn}>KEMIX</Text>
            <Text style={styles.revealKo}>케믹스</Text>
            <Text style={styles.revealTagline}>대한민국 응급의료의 차세대 혁신을 이끌다</Text>
            <Text style={styles.revealSub}>{BRAND_FULL_NAME}</Text>
          </Animated.View>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="오늘 하루 보지 않기"
              accessibilityState={{ checked: hideForDay }}
              hitSlop={CONTROL_HIT_SLOP}
              onPress={() => setHideForDay((prev) => !prev)}
              style={styles.hideForDayBtn}
            >
              <View style={[styles.hideForDayCheck, hideForDay && styles.hideForDayCheckActive]}>
                {hideForDay ? <Text style={styles.hideForDayMark}>✓</Text> : null}
              </View>
              <Text style={styles.hideForDayText}>오늘 하루 보지 않기</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="건너뛰기"
              hitSlop={CONTROL_HIT_SLOP}
              onPress={skipIntro}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>건너뛰기</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a1423',
  },
  topHalf: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  bottomHalf: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#0a1423',
  },
  typographyBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  revealEn: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 5,
    lineHeight: 50,
  },
  revealKo: {
    color: '#6ee7b7',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  revealTagline: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 320,
    lineHeight: 22,
  },
  revealSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  controls: {
    gap: 14,
    alignItems: 'center',
  },
  skipBtn: {
    minWidth: 200,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontWeight: '700',
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
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideForDayCheckActive: {
    backgroundColor: '#6ee7b7',
    borderColor: '#6ee7b7',
  },
  hideForDayMark: {
    color: '#0a1423',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
  hideForDayText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
});
