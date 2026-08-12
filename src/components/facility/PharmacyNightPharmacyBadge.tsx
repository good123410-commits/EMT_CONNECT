import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';

type PharmacyNightPharmacyBadgeProps = {
  compact?: boolean;
  appearance?: 'list' | 'detail';
};

function PharmacyNightPharmacyBadgeComponent({
  compact = false,
  appearance = 'list',
}: PharmacyNightPharmacyBadgeProps) {
  const isList = appearance === 'list';

  return (
    <View
      style={[
        styles.badge,
        compact ? styles.badgeCompact : null,
        isList ? styles.badgeList : styles.badgeDetail,
      ]}
    >
      <Text style={[styles.badgeText, isList ? styles.badgeTextList : styles.badgeTextDetail]}>
        금일 심야약국
      </Text>
    </View>
  );
}

export const PharmacyNightPharmacyBadge = memo(PharmacyNightPharmacyBadgeComponent);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeList: {
    backgroundColor: 'rgba(30, 58, 138, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.75)',
  },
  badgeDetail: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  badgeTextList: {
    color: '#bfdbfe',
  },
  badgeTextDetail: {
    color: '#1d4ed8',
  },
});
