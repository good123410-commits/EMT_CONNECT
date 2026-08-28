import { type TextInputProps } from 'react-native';
import { ShortcodeTextInput } from '@/components/content/ShortcodeTextInput';

type ShortcodeComposerFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  inputProps: TextInputProps;
};

export function ShortcodeComposerField({
  value,
  onChangeText,
  inputProps,
}: ShortcodeComposerFieldProps) {
  return (
    <ShortcodeTextInput
      {...inputProps}
      value={value}
      onChangeText={onChangeText}
      style={[{ flex: 1 }, inputProps.style]}
    />
  );
}
