export type MedicalListCardVariant = 'default' | 'er' | 'moonlight' | 'pediatric' | 'aed';

export function getMedicalListCardClass(
  variant: MedicalListCardVariant,
  selected = false,
): string {
  const base = 'mb-3 rounded-2xl border bg-kemix-surface p-4';

  switch (variant) {
    case 'er':
      return `${base} ${selected ? 'border-red-500/80 bg-kemix-elevated' : 'border-red-900/50'}`;
    case 'moonlight':
      return `${base} ${selected ? 'border-indigo-400/80 bg-kemix-elevated' : 'border-indigo-900/45'}`;
    case 'pediatric':
      return `${base} ${selected ? 'border-pink-400/80 bg-kemix-elevated' : 'border-pink-900/45'}`;
    case 'aed':
      return `${base} ${selected ? 'border-red-500/70 bg-kemix-elevated' : 'border-kemix-border'}`;
    default:
      return `${base} ${selected ? 'border-kemix-blue bg-kemix-elevated' : 'border-kemix-border'}`;
  }
}

export const MEDICAL_LIST_DISTANCE_TEXT = {
  fontSize: 14,
  color: '#A0A0A0',
} as const;

export const MEDICAL_LIST_DISTANCE_ICON = '#A0A0A0' as const;
