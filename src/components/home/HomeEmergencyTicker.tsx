import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { AppIcon } from '@/components/ui/AppIcon';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';
import {
  buildTickerDisplaySegments,
  SEGMENT_GAP,
  type TickerDisplaySegment,
} from '@/utils/emergencyTickerDisplay';

const TICKER_HEIGHT = 36;
const SCROLL_SPEED_PX_PER_SEC = 48;
const MIN_LOOP_WIDTH = 720;
const MIN_SCROLL_DISTANCE = 320;
const CHAR_WIDTH_ESTIMATE = 11;

type HomeEmergencyTickerProps = {
  items: EmergencyTickerItem[];
};

function TickerSegmentRow({ segments }: { segments: TickerDisplaySegment[] }) {
  return (
    <View style={styles.segmentRow}>
      {segments.map((segment, index) => (
        <View
          key={`${segment.sourceType}-${index}-${segment.body}`}
          style={styles.segmentItem}
        >
          <Text style={[styles.labelText, { color: segment.color }]}>({segment.label})</Text>
          <Text style={[styles.bodyText, { color: segment.color }]}> {segment.body}</Text>
          {index < segments.length - 1 ? (
            <Text style={styles.gapText}>{SEGMENT_GAP}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function buildLoopSegments(segments: TickerDisplaySegment[]): TickerDisplaySegment[] {
  if (segments.length === 0) return segments;

  let loop = [...segments];
  let guard = 0;
  while (guard < 10) {
    const estimatedWidth = loop.reduce((sum, segment) => sum + segment.text.length * CHAR_WIDTH_ESTIMATE, 0);
    if (estimatedWidth >= MIN_LOOP_WIDTH) break;
    loop = [...loop, ...segments];
    guard += 1;
  }
  return loop;
}

function estimateSegmentWidth(segments: TickerDisplaySegment[]): number {
  const textWidth = segments.reduce((sum, segment) => sum + segment.text.length * CHAR_WIDTH_ESTIMATE, 0);
  return Math.ceil(textWidth + 40);
}

export function HomeEmergencyTicker({ items }: HomeEmergencyTickerProps) {
  const segments = useMemo(() => buildTickerDisplaySegments(items), [items]);
  const loopSegments = useMemo(() => buildLoopSegments(segments), [segments]);
  const estimatedWidth = useMemo(() => estimateSegmentWidth(loopSegments), [loopSegments]);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [paused, setPaused] = useState(false);

  const translateX = useSharedValue(0);
  const loopDistance = useSharedValue(0);
  const isPaused = useSharedValue(false);

  const resolvedLoopDistance = Math.max(measuredWidth, estimatedWidth, MIN_SCROLL_DISTANCE);

  const accessibilityLabel = useMemo(
    () => segments.map((segment) => segment.text).join(' '),
    [segments],
  );

  useLayoutEffect(() => {
    loopDistance.value = resolvedLoopDistance;
    if (translateX.value <= -resolvedLoopDistance) {
      translateX.value = 0;
    }
  }, [loopDistance, resolvedLoopDistance, translateX]);

  useEffect(() => {
    setMeasuredWidth(0);
    translateX.value = 0;
  }, [loopSegments, translateX]);

  useFrameCallback((frame) => {
    'worklet';
    const distance = loopDistance.value;
    if (distance <= 0 || isPaused.value) return;

    const deltaMs = frame.timeSincePreviousFrame ?? 16;
    translateX.value -= (SCROLL_SPEED_PX_PER_SEC * deltaMs) / 1000;

    if (translateX.value <= -distance) {
      translateX.value += distance;
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleSegmentLayout = (event: LayoutChangeEvent) => {
    const width = Math.ceil(event.nativeEvent.layout.width);
    if (width > 0) {
      setMeasuredWidth((prev) => (prev === width ? prev : width));
    }
  };

  const pauseMarquee = () => {
    isPaused.value = true;
    setPaused(true);
  };

  const resumeMarquee = () => {
    isPaused.value = false;
    setPaused(false);
  };

  if (segments.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.accentRail} />
      <View style={styles.iconWrap}>
        <AppIcon name="alert-circle" size={15} color="#FF6B4A" />
      </View>

      <Pressable
        style={styles.trackPressable}
        onPressIn={pauseMarquee}
        onPressOut={resumeMarquee}
        onHoverIn={pauseMarquee}
        onHoverOut={resumeMarquee}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="길게 누르면 전광판이 잠시 멈춥니다"
      >
        <View style={styles.track}>
          <View pointerEvents="none" style={styles.measureLayer} collapsable={false}>
            <View onLayout={handleSegmentLayout} style={styles.measureContent}>
              <TickerSegmentRow segments={loopSegments} />
            </View>
          </View>

          <Animated.View style={[styles.scrollRow, animatedStyle]} pointerEvents="none">
            <TickerSegmentRow segments={loopSegments} />
            <TickerSegmentRow segments={loopSegments} />
          </Animated.View>

          {paused ? <View style={styles.pauseIndicator} pointerEvents="none" /> : null}
        </View>
      </Pressable>

      <View style={styles.liveDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: TICKER_HEIGHT,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#FF6B4A',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  accentRail: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#FF6B4A',
  },
  iconWrap: {
    paddingLeft: 8,
    paddingRight: 4,
  },
  trackPressable: {
    flex: 1,
    minHeight: TICKER_HEIGHT,
  },
  track: {
    flex: 1,
    overflow: 'hidden',
    minHeight: TICKER_HEIGHT,
    justifyContent: 'center',
  },
  measureLayer: {
    position: 'absolute',
    top: -200,
    left: 0,
    opacity: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  measureContent: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexGrow: 0,
  },
  scrollRow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingRight: 40,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  labelText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 13,
    includeFontPadding: false,
  },
  bodyText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    includeFontPadding: false,
  },
  gapText: {
    color: '#475569',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    includeFontPadding: false,
  },
  pauseIndicator: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF6B4A',
    marginRight: 10,
    marginLeft: 6,
  },
});
