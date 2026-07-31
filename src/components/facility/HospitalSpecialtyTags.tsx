import { Text, View } from 'react-native';

type Props = {
  specialties: string[];
  maxTags?: number;
};

export function HospitalSpecialtyTags({ specialties, maxTags = 6 }: Props) {
  const tags = specialties.filter(Boolean).slice(0, maxTags);
  const hiddenCount = Math.max(0, specialties.length - tags.length);

  if (tags.length === 0) {
    return <Text className="text-xs text-kemix-muted">진료과목 정보 없음</Text>;
  }

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {tags.map((tag) => (
        <View key={tag} className="rounded-full bg-kemix-elevated px-2.5 py-0.5">
          <Text className="text-[10px] font-medium text-kemix-text-secondary">{tag}</Text>
        </View>
      ))}
      {hiddenCount > 0 ? (
        <View className="rounded-full bg-kemix-bg px-2 py-0.5">
          <Text className="text-[10px] text-kemix-muted">+{hiddenCount}</Text>
        </View>
      ) : null}
    </View>
  );
}
