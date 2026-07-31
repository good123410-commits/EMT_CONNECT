import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

export type UtilitySelectOption<T extends string> = {
  value: T;
  label: string;
};

type UtilitySelectFieldProps<T extends string> = {
  label: string;
  placeholder?: string;
  hint?: string;
  options: UtilitySelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export function UtilitySelectField<T extends string>({
  label,
  placeholder = '선택하세요',
  hint,
  options,
  value,
  onChange,
}: UtilitySelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-semibold text-kemix-text">{label}</Text>
      <Pressable
        accessibilityRole="button"
        className="flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3.5 active:bg-kemix-bg"
        onPress={() => setOpen(true)}
      >
        <Text className={`text-base ${selected ? 'text-kemix-text' : 'text-kemix-muted'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#94a3b8" />
      </Pressable>
      {hint ? <Text className="mt-1.5 text-xs leading-5 text-kemix-muted">{hint}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View className="flex-1 justify-end">
            <Pressable className="rounded-t-2xl bg-kemix-surface px-4 pb-6 pt-3" onPress={(e) => e.stopPropagation()}>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-bold text-kemix-text">{label}</Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </Pressable>
              </View>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    className={`mb-2 flex-row items-center justify-between rounded-xl border px-4 py-3.5 ${
                      active ? 'border-sky-300 bg-sky-50' : 'border-kemix-border bg-kemix-surface'
                    }`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      className={`text-base ${active ? 'font-bold text-sky-900' : 'text-kemix-text'}`}
                    >
                      {option.label}
                    </Text>
                    {active ? <Ionicons name="checkmark-circle" size={20} color="#0284c7" /> : null}
                  </Pressable>
                );
              })}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
