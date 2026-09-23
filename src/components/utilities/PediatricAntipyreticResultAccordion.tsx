import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from 'react-native';
import type { PediatricAntipyreticResult } from '@/utils/pediatricAntipyreticCalc';
import {
  formatDoseMg,
  formatDoseMl,
  getFamilyLabel,
  type AntipyreticDrugFamily,
} from '@/utils/pediatricAntipyreticCalc';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PediatricAntipyreticResultAccordionProps = {
  family: AntipyreticDrugFamily | null;
  weightError: string | null;
  result: PediatricAntipyreticResult | null;
};

export function PediatricAntipyreticResultAccordion({
  family,
  weightError,
  result,
}: PediatricAntipyreticResultAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const summaryLabel = family ? getFamilyLabel(family) : '약물 미선택';

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-kemix-border bg-kemix-surface">
      <Pressable
        className="flex-row items-center px-4 py-3.5 active:bg-kemix-bg"
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color="#64748b"
        />
        <View className="ml-2 min-w-0 flex-1">
          <Text className="text-sm font-bold text-kemix-text">계산 결과</Text>
          <Text className="mt-0.5 text-[11px] text-kemix-text-secondary">
            {expanded ? '눌러서 접기' : '눌러서 펼치기'} · {summaryLabel}
          </Text>
        </View>
      </Pressable>

      {expanded ? (
        <View className="border-t border-kemix-border-light px-4 pb-4 pt-3">
          {!family ? (
            <Text className="text-sm text-kemix-text-secondary">
              약물 계열을 선택하면 결과가 표시됩니다.
            </Text>
          ) : weightError ? (
            <Text className="text-sm text-amber-700">{weightError}</Text>
          ) : result ? (
            <View className="gap-3">
              <View className="rounded-xl bg-sky-50 px-3 py-3">
                <Text className="text-xs font-semibold text-sky-800">{result.drug.label}</Text>
                <Text className="mt-1 text-lg font-bold text-sky-950">
                  {formatDoseMl(result.mlMin)} ~ {formatDoseMl(result.mlMax)} mL
                </Text>
                <Text className="mt-1 text-xs text-sky-700">
                  1회 용량 ({formatDoseMg(result.mgMin)}~{formatDoseMg(result.mgMax)} mg ·{' '}
                  {result.drug.concentrationMgPerMl} mg/mL 시럽)
                </Text>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 rounded-xl border border-kemix-border-light bg-kemix-bg px-3 py-3">
                  <Text className="text-[11px] font-semibold text-kemix-text-secondary">
                    투여 간격
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-kemix-text">
                    {result.drug.intervalLabel}
                  </Text>
                </View>
                <View className="flex-1 rounded-xl border border-kemix-border-light bg-kemix-bg px-3 py-3">
                  <Text className="text-[11px] font-semibold text-kemix-text-secondary">
                    1일 최대 횟수
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-kemix-text">
                    최대 {result.drug.maxDailyDoses}회
                  </Text>
                </View>
              </View>

              <Text className="text-[11px] leading-5 text-kemix-muted">
                체중 {result.weightKg} kg · {result.drug.guideSummary} · {result.drug.minAgeLabel}
              </Text>
            </View>
          ) : (
            <Text className="text-sm text-kemix-text-secondary">
              체중과 약물을 입력하면 결과가 표시됩니다.
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
