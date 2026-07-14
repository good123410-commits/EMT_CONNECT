import { Pressable, StyleSheet, Text, View } from 'react-native';

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const activeShadow = StyleSheet.create({
  segment: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentControlProps<T>) {
  return (
    <View className="flex-row rounded-xl bg-slate-100 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            className={`flex-1 rounded-lg py-2.5 ${active ? 'bg-white' : ''}`}
            style={active ? activeShadow.segment : undefined}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                active ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
