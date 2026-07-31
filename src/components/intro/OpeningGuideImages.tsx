import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { OPENING_SLIDES } from '@/constants/openingSlides';
import { fetchOpeningSlides, preloadSlideImages } from '@/services/openingSlideService';
import type { OpeningSlide } from '@/types/openingSlide';

const SLIDE_MS = 2400;

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
  const scale = useRef(new Animated.Value(kenBurns ? 1.04 : 1)).current;

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
      scale.setValue(1.04);
      return;
    }
    scale.setValue(1.04);
    Animated.timing(scale, {
      toValue: 1.1,
      duration: SLIDE_MS,
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

export function OpeningGuideImages() {
  const [slides, setSlides] = useState<OpeningSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const rows = await fetchOpeningSlides();
        if (cancelled) return;
        const activeSlides = getActiveSlides(rows);
        setSlides(activeSlides);
        void preloadSlideImages(activeSlides);
      } catch {
        if (cancelled) return;
        setSlides(getActiveSlides([]));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = setInterval(() => {
      setSlideIndex((index) => (index + 1) % slides.length);
    }, SLIDE_MS);

    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[slideIndex];

  return (
    <View style={styles.wrap}>
      {loading ? (
        <View style={styles.fallback}>
          <ActivityIndicator color="#6ee7b7" size="large" />
        </View>
      ) : slides.length === 0 ? (
        <View style={styles.fallback} />
      ) : (
        slides.map((slide, index) => (
          <SlideLayer
            key={slide.id}
            slide={slide}
            active={index === slideIndex}
            kenBurns={index === slideIndex}
          />
        ))
      )}

      <View pointerEvents="none" style={styles.overlay} />

      {activeSlide?.caption && !loading ? (
        <Text style={styles.caption} numberOfLines={2}>
          {activeSlide.caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0a1423',
    overflow: 'hidden',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f2744',
  },
  slide: {
    position: 'absolute',
    top: '-6%',
    left: '-6%',
    width: '112%',
    height: '112%',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,20,35,0.28)',
  },
  caption: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    overflow: 'hidden',
  },
});
