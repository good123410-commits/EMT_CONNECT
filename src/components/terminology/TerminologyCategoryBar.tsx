import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  TERMINOLOGY_ALPHA_CATEGORIES,
  TERMINOLOGY_CHOSEONG_CATEGORIES,
  type TerminologyCategoryFilter,
} from '@/types/medicalTerminology';

type Props = {
  value: TerminologyCategoryFilter;
  onChange: (value: TerminologyCategoryFilter) => void;
};

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-w-[40px] items-center rounded-xl border px-3 py-2 ${
        selected ? 'border-emerald-500 bg-emerald-500' : 'border-kemix-border bg-kemix-surface active:bg-kemix-bg'
      }`}
    >
      <Text className={`text-sm font-bold ${selected ? 'text-white' : 'text-kemix-text'}`}>{label}</Text>
    </Pressable>
  );
}

export function TerminologyCategoryBar({ value, onChange }: Props) {
  return (
    <View className="mt-3 gap-2">
      <View className="flex-row items-center gap-2">
        <FilterChip label="전체" selected={value === '전체'} onPress={() => onChange('전체')} />
        <Text className="text-[11px] font-semibold text-kemix-text-secondary">한글</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4"
      >
        {TERMINOLOGY_CHOSEONG_CATEGORIES.map((category) => (
          <FilterChip
            key={category}
            label={category}
            selected={value === category}
            onPress={() => onChange(category)}
          />
        ))}
      </ScrollView>

      <Text className="text-[11px] font-semibold text-kemix-text-secondary">English A–Z</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4"
      >
        {TERMINOLOGY_ALPHA_CATEGORIES.map((category) => (
          <FilterChip
            key={category}
            label={category}
            selected={value === category}
            onPress={() => onChange(category)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
