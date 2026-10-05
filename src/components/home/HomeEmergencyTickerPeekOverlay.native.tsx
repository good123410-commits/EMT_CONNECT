import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { HomeEmergencyTickerDetailModal } from '@/components/home/HomeEmergencyTickerDetailModal';
import {
  buildPeekListItems,
  type TickerPeekListRow,
} from '@/components/home/homeEmergencyTickerPeekUtils';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HomeEmergencyTickerPeekOverlayProps = {
  visible: boolean;
  items: EmergencyTickerItem[];
  onRequestClose: () => void;
};

export function HomeEmergencyTickerPeekOverlay({
  visible,
  items,
  onRequestClose,
}: HomeEmergencyTickerPeekOverlayProps) {
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(0);
  const closingRef = useRef(false);
  const listItems = useMemo(() => buildPeekListItems(items), [items]);
  const [selectedRow, setSelectedRow] = useState<TickerPeekListRow | null>(null);
  const maxSheetHeight = Math.min(windowHeight * 0.62, 480);

  const clearClosingFlag = useCallback(() => {
    closingRef.current = false;
  }, []);

  const finishClose = useCallback(() => {
    closingRef.current = false;
    setSelectedRow(null);
    onRequestClose();
  }, [onRequestClose]);

  const closeAnimated = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    progress.value = withTiming(
      0,
      { duration: 200, easing: Easing.in(Easing.cubic) },
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(finishClose)();
        } else {
          runOnJS(clearClosingFlag)();
        }
      },
    );
  }, [clearClosingFlag, finishClose, progress]);

  const requestListClose = useCallback(() => {
    setSelectedRow(null);
    closeAnimated();
  }, [closeAnimated]);

  useEffect(() => {
    if (!visible) return;
    setSelectedRow(null);
    closingRef.current = false;
    cancelAnimation(progress);
    progress.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.62,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 36 }],
  }));

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={requestListClose}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <AnimatedPressable
          style={[styles.backdrop, backdropStyle]}
          onPress={requestListClose}
          accessibilityLabel="긴급재난 전광판 닫기"
        />

        <Animated.View style={[styles.sheetWrap, sheetStyle]} pointerEvents="box-none">
          <View style={[styles.sheet, { maxHeight: maxSheetHeight }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderRow}>
                <View style={styles.sheetTitleRow}>
                  <AppIcon name="alert-circle" size={20} color="#F87171" />
                  <Text style={styles.sheetTitle}>긴급재난 문자 · 전체</Text>
                </View>
                <Pressable
                  onPress={requestListClose}
                  style={styles.closeButton}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                >
                  <AppIcon name="close" size={22} color="#94A3B8" />
                </Pressable>
              </View>
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
                  <Pressable
                    key={row.id}
                    style={styles.card}
                    onPress={() => setSelectedRow(row)}
                    accessibilityRole="button"
                    accessibilityHint="탭하여 상세 내용과 발생 시각을 확인합니다"
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.chip, { borderColor: row.color }]}>
                        <Text style={[styles.chipText, { color: row.color }]}>{row.label}</Text>
                      </View>
                      <AppIcon name="chevron-right" size={16} color="#64748B" />
                    </View>
                    <Text style={styles.cardBody} numberOfLines={3}>
                      {row.body}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>

      <HomeEmergencyTickerDetailModal
        visible={selectedRow !== null}
        row={selectedRow}
        onRequestClose={() => setSelectedRow(null)}
      />
    </>
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.65)',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheetTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  sheetTitle: {
    flexShrink: 1,
    fontFamily: APP_FONT.bold,
    fontSize: 16,
    color: '#F8FAFC',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.45)',
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
