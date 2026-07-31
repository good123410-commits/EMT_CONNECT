import { Text, TextInput, View } from 'react-native';

type UtilityFormFieldProps = {
  label: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
};

export function UtilityFormField({
  label,
  placeholder,
  hint,
  multiline = false,
  value = '',
  onChangeText,
}: UtilityFormFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-semibold text-kemix-text">{label}</Text>
      <TextInput
        className={`rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3 text-base text-kemix-text ${
          multiline ? 'min-h-[96px]' : ''
        }`}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
        onChangeText={onChangeText}
        editable={!!onChangeText}
      />
      {hint ? <Text className="mt-1.5 text-xs leading-5 text-kemix-muted">{hint}</Text> : null}
    </View>
  );
}
