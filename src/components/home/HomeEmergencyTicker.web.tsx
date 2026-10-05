import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HomeEmergencyTickerPeekOverlay } from '@/components/home/HomeEmergencyTickerPeekOverlay.web';
import { AppIcon } from '@/components/ui/AppIcon';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';
import {
  buildTickerDisplaySegments,
  normalizeTickerItems,
  SEGMENT_GAP,
  type TickerDisplaySegment,
} from '@/utils/emergencyTickerDisplay';

const TICKER_HEIGHT = 36;
const TICKER_BG = '#111827';
const TICKER_BORDER = 'rgba(148, 163, 184, 0.18)';
const TICKER_ICON_COLOR = '#94A3B8';
const TICKER_LIVE_DOT = '#64748B';

type HomeEmergencyTickerProps = {
  items?: EmergencyTickerItem[] | null | unknown;
};

function TickerSegmentRow({ segments }: { segments: TickerDisplaySegment[] }) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return null;
  }

  return (
    <View style={styles.segmentRow}>
      {segments.map((segment, index) => (
        <View
          key={`${segment.sourceType}-${index}-${segment.body}`}
          style={styles.segmentItem}
        >
          <Text style={[styles.bodyText, { color: segment.color }]}>
            {segment.label ? `(${segment.label}) ${segment.body}` : segment.body}
          </Text>
          {index < segments.length - 1 ? (
            <Text style={styles.gapText}>{SEGMENT_GAP}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Web: Reanimated useFrameCallback 미지원 — 가로 스크롤 + 클릭 시 목록 */
export function HomeEmergencyTicker({ items }: HomeEmergencyTickerProps) {
  const safeItems = useMemo(() => normalizeTickerItems(items), [items]);
  const segments = useMemo(() => buildTickerDisplaySegments(safeItems), [safeItems]);
  const [peekVisible, setPeekVisible] = useState(false);
  const peekVisibleRef = useRef(false);

  const accessibilityLabel = useMemo(
    () => (Array.isArray(segments) ? segments.map((segment) => segment.text).join(' ') : ''),
    [segments],
  );

  const openPeek = () => {
    peekVisibleRef.current = true;
    setPeekVisible(true);
  };

  const handlePeekClosed = () => {
    peekVisibleRef.current = false;
    setPeekVisible(false);
  };

  if (!Array.isArray(segments) || segments.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.iconWrap}>
          <AppIcon name="alert-circle" size={15} color={TICKER_ICON_COLOR} />
        </View>

        <Pressable
          style={styles.trackPressable}
          onPress={openPeek}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="클릭하여 전체 재난 문자 목록을 확인할 수 있습니다"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trackScroll}
            contentContainerStyle={styles.trackScrollContent}
          >
            <TickerSegmentRow segments={segments} />
          </ScrollView>
        </Pressable>

        <View style={styles.liveDot} />
      </View>

      <HomeEmergencyTickerPeekOverlay
        visible={peekVisible}
        items={safeItems}
        onRequestClose={handlePeekClosed}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: TICKER_HEIGHT,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: TICKER_BG,
    borderWidth: 1,
    borderColor: TICKER_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    paddingLeft: 10,
    paddingRight: 6,
    backgroundColor: TICKER_BG,
  },
  trackPressable: {
    flex: 1,
    minHeight: TICKER_HEIGHT,
  },
  trackScroll: {
    flex: 1,
  },
  trackScrollContent: {
    alignItems: 'center',
    paddingRight: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  bodyText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
  },
  gapText: {
    color: '#475569',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TICKER_LIVE_DOT,
    marginRight: 10,
    marginLeft: 6,
  },
});
