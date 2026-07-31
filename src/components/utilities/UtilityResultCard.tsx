import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type UtilityResultCardProps = {
  title: string;
  children: ReactNode;
};

export function UtilityResultCard({ title, children }: UtilityResultCardProps) {
  return (
    <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-4">
      <Text className="mb-2 text-sm font-bold text-kemix-text">{title}</Text>
      {children}
    </View>
  );
}
