import { Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
};

export function AdminFormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}: Props) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-bold text-slate-500">{label}</Text>
      <TextInput
        className={`rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 ${
          multiline ? 'min-h-[88px] py-3' : 'py-2.5'
        }`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
      />
    </View>
  );
}
