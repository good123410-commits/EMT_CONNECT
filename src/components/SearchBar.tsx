import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, TextInput, View } from 'react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  loading?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = '검색...',
  loading = false,
}: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <Ionicons name="search" size={20} color="#94a3b8" />
      <TextInput
        className="ml-2 flex-1 text-base text-slate-900"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {loading ? <ActivityIndicator size="small" color="#0f172a" /> : null}
    </View>
  );
}
