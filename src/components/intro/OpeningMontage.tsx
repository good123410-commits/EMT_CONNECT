import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_FULL_NAME } from '@/constants/branding';
import { OPENING_SLIDES } from '@/constants/openingSlides';
import { fetchOpeningSlides, preloadSlideImages } from '@/services/openingSlideService';
import type { OpeningSlide } from '@/types/openingSlide';
import {
  lockOpeningLandscape,
  restoreOpeningPortrait,
} from '@/utils/openingScreenOrientation';

const SLIDE_MS = 1400;
const REVEAL_MS = 1000;
const HOLD_MS = 2400;
const EXIT_MS = 900;

/** 세로로 폰을 잡았을 때 읽기 쉬운 터치 여백 */
const CONTROL_HIT_SLOP = { top: 20, bottom: 20, left: 24, right: 24 };

type Phase = 'loading' | 'montage' | 'reveal' | 'hold' | 'exit' | 'finished';

type OpeningMontageProps = {
  visible: boolean;
  onComplete: (options: { hideForDay: boolean }) => void;
};

function getActiveSlides(slides: OpeningSlide[]) {
  return slides.length > 0
    ? slides
    : OPENING_SLIDES.filter((slide) => slide.is_active).sort(
        (a, b) => a.display_order - b.display_order,
      );
}

function SlideLayer({
  slide,
  active,
  kenBurns,
}: {
  slide: OpeningSlide;
  active: boolean;
  kenBurns: boolean;
}) {
  const opacity = useRef(new Animated.Value(active ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(kenBurns ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: active ? 1 : 0,
      duration: 550,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [active, opacity]);

  useEffect(() => {
    if (!kenBurns) {
      scale.setValue(1.05);
      return;
    }
    scale.setValue(1.05);
    Animated.timing(scale, {
      toValue: 1.14,
      duration: 1350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [kenBurns, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.slide, { opacity, transform: [{ scale }] }]}
    >
      <Image source={{ uri: slide.image_url }} style={styles.slideImage} resizeMode="cover" />
    </Animated.View>
  );
}

export function OpeningMontage({ visible, onComplete }: OpeningMontageProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finishedRef = useRef(false);
  const timelineStartedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hideForDayRef = useRef(false);

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(0.88)).current;
  const captionOpacity = useRef(new Animated.Value(0)).current;
  const overlayDarkness = useRef(new Animated.Value(0)).current;
  const baseOverlayOpacity = useRef(new Animated.Value(1)).current;

  const [phase, setPhase] = useState<Phase>('loading');
  const [slides, setSlides] = useState<OpeningSlide[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [hideForDay, setHideForDay] = useState(false);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      clearTimeout(id);
      clearInterval(id);
    }
    timersRef.current = [];
  }, []);

  const finishIntro = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    setPhase('finished');
    await restoreOpeningPortrait();
    onCompleteRef.current({ hideForDay: hideForDayRef.current });
  }, [clearTimers]);

  const runExitAnimation = useCallback(
    (duration = EXIT_MS) => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    },
    [containerOpacity],
  );

  const skipIntro = useCallback(() => {
    if (finishedRef.current) return;
    clearTimers();
    setPhase('exit');
    runExitAnimation(Math.min(EXIT_MS, 400));
    const exitTimer = setTimeout(() => {
      finishIntro();
    }, Math.min(EXIT_MS, 400));
    timersRef.current.push(exitTimer);
  }, [clearTimers, finishIntro, runExitAnimation]);

  useEffect(() => {
    hideForDayRef.current = hideForDay;
  }, [hideForDay]);

  useEffect(() => {
    if (!visible) return undefined;

    void lockOpeningLandscape();

    finishedRef.current = false;
    timelineStartedRef.current = false;
    hideForDayRef.current = false;
    setHideForDay(false);
    setPhase('loading');
    setSlides([]);
    setSlideIndex(0);
    containerOpacity.setValue(1);
    revealOpacity.setValue(0);
    revealScale.setValue(0.88);
    captionOpacity.setValue(0);
    overlayDarkness.setValue(0);
    baseOverlayOpacity.setValue(1);

    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchOpeningSlides();
        if (cancelled) return;
        const activeSlides = getActiveSlides(rows);
        setSlides(activeSlides);
        void preloadSlideImages(activeSlides);
        setPhase('montage');
      } catch {
        if (cancelled) return;
        const activeSlides = getActiveSlides([]);
        setSlides(activeSlides);
        setPhase('montage');
      }
    })();

    return () => {
      cancelled = true;
      clearTimers();
      void restoreOpeningPortrait();
    };
  }, [
    visible,
    clearTimers,
    containerOpacity,
    revealOpacity,
    revealScale,
    captionOpacity,
    overlayDarkness,
    baseOverlayOpacity,
  ]);

  useEffect(() => {
    if (!visible || slides.length === 0 || timelineStartedRef.current || phase !== 'montage') {
      return undefined;
    }

    timelineStartedRef.current = true;

    const montageMs = SLIDE_MS * slides.length;
    const totalMs = montageMs + REVEAL_MS + HOLD_MS + EXIT_MS;

    const slideTimer = setInterval(() => {
      setSlideIndex((index) => (index + 1) % slides.length);
    }, SLIDE_MS);

    const revealTimer = setTimeout(() => setPhase('reveal'), montageMs);
    const holdTimer = setTimeout(() => setPhase('hold'), montageMs + REVEAL_MS);
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      runExitAnimation(EXIT_MS);
    }, montageMs + REVEAL_MS + HOLD_MS);
    const finishTimer = setTimeout(() => {
      finishIntro();
    }, totalMs);

    timersRef.current = [slideTimer, revealTimer, holdTimer, exitTimer, finishTimer];

    return () => {
      clearTimers();
      timelineStartedRef.current = false;
    };
  }, [visible, slides, phase, finishIntro, clearTimers, runExitAnimation]);

  useEffect(() => {
    if (phase === 'reveal' || phase === 'hold' || phase === 'exit') {
      Animated.parallel([
        Animated.timing(revealOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(revealScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(overlayDarkness, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(baseOverlayOpacity, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, revealOpacity, revealScale, overlayDarkness, baseOverlayOpacity]);

  useEffect(() => {
    if (phase === 'montage') {
      captionOpacity.setValue(0);
      Animated.timing(captionOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      captionOpacity.setValue(0);
    }
  }, [phase, slideIndex, captionOpacity]);

  if (!visible || phase === 'finished') return null;

  const showReveal = phase === 'reveal' || phase === 'hold' || phase === 'exit';
  const activeSlide = slides[slideIndex];
  const isLandscape = width > height;
  const revealFontScale = isLandscape
    ? Math.min(width / 720, 1.25)
    : Math.min(width / 390, 1.15);

  const portraitControlInsets = isLandscape
    ? {
        top: Math.max(insets.left, insets.right, 12),
        bottom: Math.max(insets.left, insets.right, 12),
        left: Math.max(insets.top, insets.bottom, 12),
        right: Math.max(insets.top, insets.bottom, 12),
      }
    : {
        top: insets.top,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
      };

  const controlsLayerStyle = isLandscape
    ? {
        width: height,
        height: width,
        left: (width - height) / 2,
        top: (height - width) / 2,
        transform: [{ rotate: '-90deg' as const }],
      }
    : StyleSheet.absoluteFillObject;

  return (
    <Modal visible transparent={false} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.root, { opacity: containerOpacity }]}>
        <View style={styles.slides}>
          {slides.length === 0 ? (
            <View style={styles.fallbackBg} />
          ) : (
            slides.map((slide, i) => (
              <SlideLayer
                key={slide.id}
                slide={slide}
                active={i === slideIndex}
                kenBurns={i === slideIndex && phase === 'montage'}
              />
            ))
          )}
        </View>

        {activeSlide?.caption && phase === 'montage' ? (
          <Animated.Text
            style={[
              styles.caption,
              isLandscape ? styles.captionLandscape : null,
              { opacity: captionOpacity },
            ]}
          >
            {activeSlide.caption}
          </Animated.Text>
        ) : null}

        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, styles.overlayBase, { opacity: baseOverlayOpacity }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, styles.overlayDark, { opacity: overlayDarkness }]}
        />

        {showReveal ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.reveal,
              {
                opacity: revealOpacity,
                transform: [{ scale: revealScale }],
              },
            ]}
          >
            <Text style={[styles.revealEn, { fontSize: 48 * revealFontScale }]}>KEMIX</Text>
            <Text style={[styles.revealKo, { fontSize: 20 * revealFontScale }]}>케믹스</Text>
            <Text
              style={[
                styles.revealTagline,
                isLandscape ? styles.revealTaglineLandscape : null,
                { fontSize: 15 * revealFontScale },
              ]}
            >
              대한민국 응급의료의 차세대 혁신을 이끌다
            </Text>
            <Text style={[styles.revealSub, { fontSize: 12 * revealFontScale }]}>
              {BRAND_FULL_NAME}
            </Text>
          </Animated.View>
        ) : null}

        {phase === 'loading' ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6ee7b7" />
          </View>
        ) : null}

        <View pointerEvents="box-none" style={[styles.controlsLayer, controlsLayerStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="건너뛰기"
            hitSlop={CONTROL_HIT_SLOP}
            onPress={skipIntro}
            style={[
              styles.skipBtn,
              {
                top: portraitControlInsets.top + 8,
                right: portraitControlInsets.right + 8,
              },
            ]}
          >
            <Text style={styles.skipText}>건너뛰기</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="오늘 하루 보지 않기"
            accessibilityState={{ checked: hideForDay }}
            hitSlop={CONTROL_HIT_SLOP}
            onPress={() => setHideForDay((prev) => !prev)}
            style={[
              styles.hideForDayBtn,
              isLandscape ? styles.hideForDayBtnLandscape : styles.hideForDayBtnPortrait,
              {
                bottom: portraitControlInsets.bottom + 12,
                ...(isLandscape
                  ? { left: portraitControlInsets.left + 16 }
                  : null),
              },
            ]}
          >
            <View style={[styles.hideForDayCheck, hideForDay && styles.hideForDayCheckActive]}>
              {hideForDay ? <Text style={styles.hideForDayMark}>✓</Text> : null}
            </View>
            <Text style={styles.hideForDayText}>오늘 하루 보지 않기</Text>
          </Pressable>
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
  slides: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1423',
    overflow: 'hidden',
  },
  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f2744',
  },
  slide: {
    position: 'absolute',
    top: '-8%',
    left: '-8%',
    width: '116%',
    height: '116%',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBase: {
    backgroundColor: 'rgba(15,39,68,0.55)',
  },
  overlayDark: {
    backgroundColor: 'rgba(10,20,35,0.93)',
  },
  caption: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '20%',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    overflow: 'hidden',
  },
  captionLandscape: {
    bottom: '14%',
    fontSize: 14,
    paddingHorizontal: 24,
  },
  reveal: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  revealEn: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 6,
    lineHeight: 56,
  },
  revealKo: {
    color: '#6ee7b7',
    fontWeight: '700',
    marginTop: 10,
  },
  revealTagline: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 320,
    lineHeight: 22,
  },
  revealTaglineLandscape: {
    maxWidth: 560,
    marginTop: 14,
  },
  revealSub: {
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsLayer: {
    position: 'absolute',
    zIndex: 20,
  },
  skipBtn: {
    position: 'absolute',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  hideForDayBtn: {
    position: 'absolute',
    zIndex: 10,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideForDayBtnPortrait: {
    left: 0,
    right: 0,
  },
  hideForDayBtnLandscape: {
    alignSelf: 'flex-start',
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
