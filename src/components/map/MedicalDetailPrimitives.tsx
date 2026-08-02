import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';

export function MedicalDetailBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

export function MedicalDetailSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function MedicalDetailText({
  children,
  variant = 'body',
}: {
  children: ReactNode;
  variant?: 'body' | 'secondary' | 'muted' | 'title';
}) {
  const style =
    variant === 'title'
      ? styles.title
      : variant === 'secondary'
        ? styles.secondary
        : variant === 'muted'
          ? styles.muted
          : styles.bodyText;
  return <Text style={style}>{children}</Text>;
}

export function MedicalDetailCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function MedicalDetailInfoTile({
  icon,
  label,
  value,
  valueColor = MEDICAL_DETAIL.text,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={18} color={MEDICAL_DETAIL.textMuted} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color: valueColor }]}>{value}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.tile}>{content}</View>;
  }

  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: MEDICAL_DETAIL.background,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MEDICAL_DETAIL.text,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: MEDICAL_DETAIL.text,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: MEDICAL_DETAIL.text,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    color: MEDICAL_DETAIL.textSecondary,
  },
  muted: {
    fontSize: 12,
    lineHeight: 18,
    color: MEDICAL_DETAIL.textMuted,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MEDICAL_DETAIL.border,
    backgroundColor: MEDICAL_DETAIL.card,
    padding: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: MEDICAL_DETAIL.card,
    borderWidth: 1,
    borderColor: MEDICAL_DETAIL.border,
    padding: 12,
  },
  tileLabel: {
    marginTop: 4,
    fontSize: 12,
    color: MEDICAL_DETAIL.textSecondary,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700',
    color: MEDICAL_DETAIL.text,
  },
});
