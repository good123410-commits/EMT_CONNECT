import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import type { TickerPeekListRow } from '@/components/home/homeEmergencyTickerPeekUtils';

type HomeEmergencyTickerDetailModalProps = {
  visible: boolean;
  row: TickerPeekListRow | null;
  onRequestClose: () => void;
};

export function HomeEmergencyTickerDetailModal({
  visible,
  row,
  onRequestClose,
}: HomeEmergencyTickerDetailModalProps) {
  if (!visible || !row) {
    return null;
  }

  const timeLabel = row.occurredAtLabel ?? '시각 정보 없음';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable style={styles.backdrop} onPress={onRequestClose} accessibilityLabel="상세 닫기" />

        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={[styles.chip, { borderColor: row.color }]}>
              <Text style={[styles.chipText, { color: row.color }]}>{row.label}</Text>
            </View>
            <Pressable
              onPress={onRequestClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <AppIcon name="close" size={22} color="#94A3B8" />
            </Pressable>
          </View>

          <Text style={styles.timeLabel}>발생·수신 시각</Text>
          <Text style={styles.timeValue} accessibilityRole="text">
            {timeLabel}
          </Text>

          <ScrollView style={styles.bodyScroll} bounces={false}>
            <Text style={styles.bodyText}>{row.fullMessage}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
  },
  dialog: {
    maxHeight: '78%',
    borderRadius: APP_RADIUS.cardLg,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: APP_FONT.semibold,
    fontSize: 11,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.45)',
  },
  timeLabel: {
    fontFamily: APP_FONT.regular,
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  timeValue: {
    fontFamily: APP_FONT.semibold,
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 12,
  },
  bodyScroll: {
    maxHeight: 320,
  },
  bodyText: {
    fontFamily: APP_FONT.regular,
    fontSize: 14,
    lineHeight: 21,
    color: '#F1F5F9',
  },
});
