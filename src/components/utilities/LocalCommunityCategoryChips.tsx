import { ScrollView, Pressable, Text, View } from 'react-native';
import {
  LOCAL_COMMUNITY_CATEGORIES,
  LOCAL_COMMUNITY_CATEGORY_LABELS,
  type LocalCommunityCategory,
} from '@/types/localCommunity';

type LocalCommunityCategoryChipsProps = {
  value: LocalCommunityCategory | 'all';
  onChange: (value: LocalCommunityCategory | 'all') => void;
};

const CHIP_OPTIONS: Array<{ value: LocalCommunityCategory | 'all'; label: string }> = [
  { value: 'all', label: '전체' },
  ...LOCAL_COMMUNITY_CATEGORIES.map((cat) => ({
    value: cat,
    label: LOCAL_COMMUNITY_CATEGORY_LABELS[cat],
  })),
];

export function LocalCommunityCategoryChips({
  value,
  onChange,
}: LocalCommunityCategoryChipsProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-kemix-text">카테고리</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {CHIP_OPTIONS.map((chip) => {
          const active = chip.value === value;
          return (
            <Pressable
              key={chip.value}
              className={`rounded-full border px-3 py-2 ${
                active ? 'border-teal-500 bg-teal-50' : 'border-kemix-border bg-kemix-surface'
              }`}
              onPress={() => onChange(chip.value)}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? 'text-teal-800' : 'text-kemix-text-secondary'
                }`}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
