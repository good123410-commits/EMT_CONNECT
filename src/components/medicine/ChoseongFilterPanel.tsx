import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  MEDICINE_CHOSEONG_FILTERS,
  type MedicineChoseongFilter,
} from '@/utils/medicineChoseong';

type ChoseongFilterPanelProps = {
  value: MedicineChoseongFilter;
  onChange: (value: MedicineChoseongFilter) => void;
};

export function ChoseongFilterPanel({ value, onChange }: ChoseongFilterPanelProps) {
  return (
    <View className="mt-3">
      <Text className="mb-2 text-xs font-semibold text-kemix-text-secondary">초성 · 알파벳 빠른 필터</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4"
      >
        {MEDICINE_CHOSEONG_FILTERS.map((filter) => {
          const selected = value === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => onChange(filter)}
              className={`min-w-[44px] items-center rounded-xl border px-3 py-2 ${
                selected
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-kemix-border bg-kemix-surface active:bg-kemix-bg'
              }`}
            >
              <Text
                className={`text-sm font-bold ${selected ? 'text-white' : 'text-kemix-text'}`}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
