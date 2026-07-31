import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import {
  clampIntervalHours,
  INTERVAL_PRESET_HOURS,
  parseIntervalInput,
} from '@/utils/medicationTimer';

type IntervalMode = '4' | '6' | 'custom';

function resolveMode(hours: number): IntervalMode {
  if (hours === 4) return '4';
  if (hours === 6) return '6';
  return 'custom';
}

type MedicationIntervalPickerProps = {
  intervalHours: number;
  onIntervalChange: (hours: number) => void;
  label?: string;
};

export function MedicationIntervalPicker({
  intervalHours,
  onIntervalChange,
  label = '복용 간격',
}: MedicationIntervalPickerProps) {
  const mode = resolveMode(intervalHours);
  const [customText, setCustomText] = useState(
    mode === 'custom' ? String(intervalHours) : '',
  );

  useEffect(() => {
    const nextMode = resolveMode(intervalHours);
    if (nextMode === 'custom') {
      setCustomText(String(intervalHours));
    }
  }, [intervalHours]);

  const segmentOptions: Array<{ value: IntervalMode; label: string }> = [
  ...INTERVAL_PRESET_HOURS.map((h) => ({
    value: h === 4 ? '4' : '6' as IntervalMode,
    label: `${h}시간`,
  })),
    { value: 'custom', label: '직접 입력' },
  ];

  const handleModeChange = (value: IntervalMode) => {
    if (value === 'custom') {
      const parsed = parseIntervalInput(customText);
      onIntervalChange(parsed ?? clampIntervalHours(intervalHours));
      return;
    }
    onIntervalChange(Number(value));
  };

  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-kemix-text">{label}</Text>
      <SegmentControl options={segmentOptions} value={mode} onChange={handleModeChange} />
      {mode === 'custom' ? (
        <View className="mt-3">
          <Text className="mb-1.5 text-xs font-semibold text-kemix-text-secondary">간격 (시간)</Text>
          <TextInput
            className="rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3 text-base text-kemix-text"
            placeholder="예: 3, 8, 12"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            value={customText}
            onChangeText={(text) => {
              setCustomText(text);
              const parsed = parseIntervalInput(text);
              if (parsed !== null) onIntervalChange(parsed);
            }}
          />
          <Text className="mt-1.5 text-[11px] text-kemix-muted">1~48시간 범위에서 설정할 수 있습니다.</Text>
        </View>
      ) : null}
    </View>
  );
}
