import { Text, View } from 'react-native';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';

type Props = {
  specialties: string[];
  maxTags?: number;
  appearance?: 'default' | 'light';
};

export function HospitalSpecialtyTags({ specialties, maxTags = 6, appearance = 'default' }: Props) {
  const tags = specialties.filter(Boolean).slice(0, maxTags);
  const hiddenCount = Math.max(0, specialties.length - tags.length);
  const isLight = appearance === 'light';

  if (tags.length === 0) {
    return (
      <Text
        className={isLight ? undefined : 'text-xs text-kemix-muted'}
        style={isLight ? { fontSize: 12, color: MEDICAL_DETAIL.textMuted } : undefined}
      >
        진료과목 정보 없음
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {tags.map((tag) => (
        <View
          key={tag}
          className={isLight ? undefined : 'rounded-full bg-kemix-elevated px-2.5 py-0.5'}
          style={
            isLight
              ? {
                  borderRadius: 999,
                  backgroundColor: MEDICAL_DETAIL.cardMuted,
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                }
              : undefined
          }
        >
          <Text
            className={isLight ? undefined : 'text-[10px] font-medium text-kemix-text-secondary'}
            style={
              isLight
                ? { fontSize: 10, fontWeight: '500', color: MEDICAL_DETAIL.textSecondary }
                : undefined
            }
          >
            {tag}
          </Text>
        </View>
      ))}
      {hiddenCount > 0 ? (
        <View
          className={isLight ? undefined : 'rounded-full bg-kemix-bg px-2 py-0.5'}
          style={
            isLight
              ? {
                  borderRadius: 999,
                  backgroundColor: MEDICAL_DETAIL.card,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }
              : undefined
          }
        >
          <Text
            className={isLight ? undefined : 'text-[10px] text-kemix-muted'}
            style={isLight ? { fontSize: 10, color: MEDICAL_DETAIL.textMuted } : undefined}
          >
            +{hiddenCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
