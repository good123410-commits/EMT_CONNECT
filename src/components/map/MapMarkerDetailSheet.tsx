import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DistanceRow } from '@/components/map/DistanceText';
import type { DistanceUnitMode } from '@/utils/formatDistance';

type MapMarkerDetailSheetProps = {
  visible: boolean;
  title: string;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  children?: React.ReactNode;
};

export function MapMarkerDetailSheet({
  visible,
  title,
  loading,
  error,
  onClose,
  onRetry,
  children,
}: MapMarkerDetailSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.loadingText}>상세 정보를 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              {onRetry ? (
                <Pressable style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentInner}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

type MapMarkerShellCardProps = {
  name: string;
  distanceM: number;
  walkMin: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  badge?: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  distanceUnitMode?: DistanceUnitMode;
  onDistanceUnitModeChange?: (mode: DistanceUnitMode) => void;
  onPress: () => void;
  selected?: boolean;
};

function MapMarkerShellCardComponent({
  name,
  distanceM,
  walkMin,
  icon,
  iconColor = '#64748b',
  badge,
  subtitle,
  statusBadge,
  distanceUnitMode = 'auto',
  onDistanceUnitModeChange,
  onPress,
  selected,
}: MapMarkerShellCardProps) {
  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.cardRow}>
        <View style={styles.pinWrap}>
          <View style={[styles.pinCircle, selected && styles.pinCircleSelected]}>
            <Ionicons name={icon} size={22} color={selected ? '#dc2626' : iconColor} />
          </View>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {name}
          </Text>
          {statusBadge}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {distanceM > 0 ? (
            <View style={styles.distanceRow}>
              <DistanceRow
                distanceM={distanceM}
                walkMin={walkMin}
                unitMode={distanceUnitMode}
                onUnitModeChange={onDistanceUnitModeChange}
              />
            </View>
          ) : (
            <Text style={styles.hintText}>탭하여 상세 정보 보기</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </View>
    </Pressable>
  );
}

export const MapMarkerShellCard = memo(MapMarkerShellCardComponent);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#ffffff',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    maxHeight: 480,
  },
  contentInner: {
    paddingBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  cardSelected: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinWrap: {
    alignItems: 'center',
    marginRight: 12,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircleSelected: {
    backgroundColor: '#fee2e2',
  },
  badge: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  distanceRow: {
    marginTop: 6,
  },
  hintText: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
});
