import { Pressable, Text, View } from 'react-native';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';
import {
  ANTIPYRETIC_FAMILY_OPTIONS,
  type AntipyreticDrugFamily,
} from '@/utils/pediatricAntipyreticCalc';

type PediatricAntipyreticDrugPickerProps = {
  value: AntipyreticDrugFamily | null;
  onChange: (value: AntipyreticDrugFamily) => void;
};

export function PediatricAntipyreticDrugPicker({
  value,
  onChange,
}: PediatricAntipyreticDrugPickerProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-semibold text-kemix-text">약물 선택</Text>
      <View className="flex-row gap-2">
        {ANTIPYRETIC_FAMILY_OPTIONS.map((option) => {
          const active = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`flex-1 rounded-xl border px-3 py-3 ${
                active
                  ? 'border-sky-400 bg-sky-600'
                  : 'border-kemix-border bg-kemix-surface active:bg-kemix-bg'
              }`}
              style={{ minHeight: KEMIX_TOUCH_MIN_HEIGHT }}
              onPress={() => onChange(option.id)}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  active ? 'text-white' : 'text-kemix-text'
                }`}
              >
                {option.label}
              </Text>
              <Text
                className={`mt-1 text-center text-[10px] leading-4 ${
                  active ? 'text-sky-100' : 'text-kemix-muted'
                }`}
              >
                {option.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-1.5 text-xs leading-5 text-kemix-muted">
        계열을 선택하면 즉시 용량 계산·투약 기록에 반영됩니다.
      </Text>
    </View>
  );
}
