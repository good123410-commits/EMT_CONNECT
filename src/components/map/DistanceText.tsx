import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import {
  cycleDistanceUnitMode,
  formatDistanceMeters,
  type DistanceUnitMode,
} from '@/utils/formatDistance';

type DistanceTextProps = {
  distanceM: number;
  walkMin?: number;
  unitMode?: DistanceUnitMode;
  onUnitModeChange?: (next: DistanceUnitMode) => void;
  showWalkMin?: boolean;
  textStyle?: object;
};

function DistanceTextComponent({
  distanceM,
  walkMin,
  unitMode = 'auto',
  onUnitModeChange,
  showWalkMin = true,
  textStyle,
}: DistanceTextProps) {
  if (distanceM <= 0) return null;

  const distanceLabel = formatDistanceMeters(distanceM, unitMode);
  const label =
    showWalkMin && walkMin !== undefined && walkMin > 0
      ? `${distanceLabel} · ${walkMin}분`
      : distanceLabel;

  if (!onUnitModeChange) {
    return <Text style={[styles.text, textStyle]}>{label}</Text>;
  }

  return (
    <Pressable
      onPress={() => onUnitModeChange(cycleDistanceUnitMode(unitMode))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`거리 ${label}, 탭하여 단위 변경`}
    >
      <Text style={[styles.text, styles.tappable, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export const DistanceText = memo(DistanceTextComponent);

const styles = StyleSheet.create({
  text: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tappable: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});

export function DistanceRow({
  distanceM,
  walkMin,
  unitMode,
  onUnitModeChange,
}: Omit<DistanceTextProps, 'showWalkMin'>) {
  if (distanceM <= 0) return null;

  return (
    <Pressable
      style={rowStyles.row}
      onPress={onUnitModeChange ? () => onUnitModeChange(cycleDistanceUnitMode(unitMode ?? 'auto')) : undefined}
      disabled={!onUnitModeChange}
    >
      <Ionicons name="walk-outline" size={14} color="#64748b" />
      <DistanceText
        distanceM={distanceM}
        walkMin={walkMin}
        unitMode={unitMode}
        showWalkMin
      />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
