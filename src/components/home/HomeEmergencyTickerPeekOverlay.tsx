import { useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';
import { EMERGENCY_TICKER_SOURCE_LABELS } from '@/types/emergencyTicker';
import {
  buildTickerDisplaySegments,
  compareEmergencyTickerItems,
  normalizeTickerItems,
  sanitizeTickerMessage,
} from '@/utils/emergencyTickerDisplay';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HomeEmergencyTickerPeekOverlayProps = {
  visible: boolean;
  /** 손을 뗄 때마다 증가 — 닫힘 애니메이션 트리거 */
  dismissTick: number;
  items: EmergencyTickerItem[];
  onRequestClose: () => void;
};

function resolveSourceLabel(sourceType: string): string {
  return EMERGENCY_TICKER_SOURCE_LABELS[sourceType] ?? '알림';
}

function resolveSourceColor(sourceType: string): string {
  switch (sourceType) {
    case 'weather':
      return '#60A5FA';
    case 'forest_fire':
      return '#F87171';
    case 'disaster_sms':
      return '#FACC15';
    case 'admin':
      return '#E2E8F0';
    default:
      return '#CBD5E1';
  }
}

function buildPeekListItems(items: EmergencyTickerItem[]) {
  const normalized = normalizeTickerItems(items).sort(compareEmergencyTickerItems);
  const segments = buildTickerDisplaySegments(normalized);
  if (segments.length > 0) {
    return segments.map((segment) => ({
      id: `${segment.sourceType}:${segment.body}`,
      sourceType: segment.sourceType,
      label: segment.label || resolveSourceLabel(segment.sourceType),
      color: segment.color,
      body: segment.body,
    }));
  }

  return normalized.map((item, index) => {
    const body = sanitizeTickerMessage(item.message);
    return {
      id: `${item.sourceType}:${body}:${index}`,
      sourceType: item.sourceType,
      label: resolveSourceLabel(item.sourceType),
      color: resolveSourceColor(item.sourceType),
      body: body || item.message,
    };
  });
}

export function HomeEmergencyTickerPeekOverlay({
  visible,
  dismissTick,
  items,
  onRequestClose,
}: HomeEmergencyTickerPeekOverlayProps) {
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const closingRef = useRef(false);
  const listItems = buildPeekListItems(items);
  const maxSheetHeight = Math.min(windowHeight * 0.62, 480);

  const closeAnimated = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    progress.value = withTiming(
      0,
      { duration: 200, easing: Easing.in(Easing.cubic) },
      (finished) => {
        closingRef.current = false;
        if (finished) {
          runOnJS(onRequestClose)();
        }
      },
    );
  }, [onRequestClose, progress]);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      progress.value = withTiming(1, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [visible, progress]);

  useEffect(() => {
    if (dismissTick < 1) return;
    closeAnimated();
  }, [dismissTick, closeAnimated]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.62,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 36 }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeAnimated}
    >
      <View
        style={styles.root}
        accessibilityViewIsModal
        onTouchEnd={closeAnimated}
        onTouchCancel={closeAnimated}
      >
        <AnimatedPressable
          style={[styles.backdrop, backdropStyle]}
          onPress={closeAnimated}
          accessibilityLabel="긴급재난 전광판 닫기"
        />

        <Animated.View style={[styles.sheetWrap, sheetStyle]} pointerEvents="box-none">
          <View style={[styles.sheet, { maxHeight: maxSheetHeight }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <AppIcon name="alert-circle" size={20} color="#F87171" />
                <Text style={styles.sheetTitle}>긴급재난 문자 · 전체</Text>
              </View>
              <Text style={styles.sheetHint}>손을 떼면 전광판이 다시 흐릅니다</Text>
            </View>

            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              bounces={listItems.length > 4}
            >
              {listItems.length === 0 ? (
                <Text style={styles.emptyText}>표시할 재난 정보가 없습니다.</Text>
              ) : (
                listItems.map((row) => (
                  <View key={row.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.chip, { borderColor: row.color }]}>
                        <Text style={[styles.chipText, { color: row.color }]}>{row.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardBody}>{row.body}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    borderRadius: APP_RADIUS.cardLg,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.65)',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontFamily: APP_FONT.bold,
    fontSize: 16,
    color: '#F8FAFC',
  },
  sheetHint: {
    marginTop: 6,
    fontFamily: APP_FONT.regular,
    fontSize: 11,
    color: '#94A3B8',
  },
  listScroll: {
    flexGrow: 0,
  },
  listContent: {
    padding: 12,
    paddingBottom: 16,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontFamily: APP_FONT.semibold,
    fontSize: 10,
  },
  cardBody: {
    fontFamily: APP_FONT.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#E2E8F0',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: APP_FONT.regular,
    fontSize: 13,
    color: '#94A3B8',
  },
});
