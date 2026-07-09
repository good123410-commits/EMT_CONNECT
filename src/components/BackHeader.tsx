import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type BackHeaderProps = {
  title: string;
  onBack: () => void;
};

export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <View className="mb-4 flex-row items-center">
      <Pressable
        className="mr-3 rounded-full bg-slate-100 p-2"
        onPress={onBack}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={22} color="#0f172a" />
      </Pressable>
      <Text className="flex-1 text-lg font-bold text-slate-900">{title}</Text>
    </View>
  );
}
