import { Text, View } from 'react-native';
import type { MedicalTerminology } from '@/types/medicalTerminology';

type Props = {
  term: MedicalTerminology;
};

export function TerminologyListCard({ term }: Props) {
  return (
    <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-base font-bold leading-6 text-kemix-text">{term.korean}</Text>
        <View className="rounded-full bg-emerald-50 px-2.5 py-1">
          <Text className="text-[11px] font-bold text-emerald-700">{term.category}</Text>
        </View>
      </View>
      <Text className="mt-2 text-sm leading-6 text-kemix-text-secondary">{term.english}</Text>
    </View>
  );
}
