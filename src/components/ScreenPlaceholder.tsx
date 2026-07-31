import { Text, View } from 'react-native';

type ScreenPlaceholderProps = {
  title: string;
  description: string;
};

export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <View className="flex-1 items-center justify-center bg-kemix-surface px-6">
      <Text className="text-2xl font-bold text-kemix-text">{title}</Text>
      <Text className="mt-3 text-center text-base text-kemix-text-secondary">{description}</Text>
    </View>
  );
}
