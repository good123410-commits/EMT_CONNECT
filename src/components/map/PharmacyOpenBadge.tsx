import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PharmacyOpenStatus } from '@/utils/pharmacyHours';

type PharmacyOpenBadgeProps = {
  status: PharmacyOpenStatus;
  compact?: boolean;
  appearance?: 'list' | 'detail';
};

function PharmacyOpenBadgeComponent({
  status,
  compact = false,
  appearance = 'list',
}: PharmacyOpenBadgeProps) {
  if (!status.hasHours) return null;

  const open = status.isOpenNow;
  const label = open ? '영업 중 🟢' : '영업 종료 🔴';
  const isList = appearance === 'list';

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : null,
        isList
          ? open
            ? styles.badgeOpenList
            : styles.badgeClosedList
          : open
            ? styles.badgeOpen
            : styles.badgeClosed,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isList
            ? open
              ? styles.badgeTextOpenList
              : styles.badgeTextClosedList
            : open
              ? styles.badgeTextOpen
              : styles.badgeTextClosed,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export const PharmacyOpenBadge = memo(PharmacyOpenBadgeComponent);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  badgeCompact: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeOpen: {
    backgroundColor: '#dcfce7',
  },
  badgeClosed: {
    backgroundColor: '#fee2e2',
  },
  badgeOpenList: {
    backgroundColor: 'rgba(20, 83, 45, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(20, 83, 45, 0.65)',
  },
  badgeClosedList: {
    backgroundColor: 'rgba(69, 10, 10, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.65)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextOpen: {
    color: '#15803d',
  },
  badgeTextClosed: {
    color: '#b91c1c',
  },
  badgeTextOpenList: {
    color: '#86efac',
  },
  badgeTextClosedList: {
    color: '#fca5a5',
  },
});
