import { Text, View } from 'react-native';

type EmptyStateProps = {
  message: string;
  hint?: string;
};

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <View className="items-center py-12">
      <Text className="text-base font-medium text-slate-600">{message}</Text>
      {hint ? <Text className="mt-2 text-center text-sm text-slate-400">{hint}</Text> : null}
    </View>
  );
}
