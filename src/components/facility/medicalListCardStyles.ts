export type MedicalListCardVariant =
  | 'default'
  | 'er'
  | 'moonlight'
  | 'pediatric'
  | 'aed'
  | 'pharmacy-night'
  | 'pharmacy-open';

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
    case 'pharmacy-night':
      return `${base} ${selected ? 'border-teal-400/70 bg-teal-950/15' : 'border-teal-800/35 bg-teal-950/8'}`;
    case 'pharmacy-open':
      return `${base} ${selected ? 'border-green-400/80 bg-green-950/15' : 'border-green-800/45 bg-green-950/10'}`;
    default:
      return `${base} ${selected ? 'border-kemix-blue bg-kemix-elevated' : 'border-kemix-border'}`;
  }
}

export const MEDICAL_LIST_DISTANCE_TEXT = {
  fontSize: 14,
  color: '#A0A0A0',
} as const;

export const MEDICAL_LIST_DISTANCE_ICON = '#A0A0A0' as const;
