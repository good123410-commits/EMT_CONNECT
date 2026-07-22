import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PharmacyOpenStatus } from '@/utils/pharmacyHours';

type PharmacyOpenBadgeProps = {
  status: PharmacyOpenStatus;
  compact?: boolean;
};

function PharmacyOpenBadgeComponent({ status, compact = false }: PharmacyOpenBadgeProps) {
  if (!status.hasHours) return null;

  const open = status.isOpenNow;
  const label = open ? '영업 중 🟢' : '영업 종료 🔴';

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : null,
        open ? styles.badgeOpen : styles.badgeClosed,
      ]}
    >
      <Text style={[styles.badgeText, open ? styles.badgeTextOpen : styles.badgeTextClosed]}>
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
});
