import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { UtilityFormField } from '@/components/utilities/UtilityFormField';
import { UtilityResultCard } from '@/components/utilities/UtilityResultCard';
import { UtilitySelectField } from '@/components/utilities/UtilitySelectField';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';
import {
  ANTIPYRETIC_DRUGS,
  calculatePediatricAntipyretic,
  formatDoseMg,
  formatDoseMl,
  parseWeightKg,
  type AntipyreticDrugId,
} from '@/utils/pediatricAntipyreticCalc';

const DRUG_OPTIONS = ANTIPYRETIC_DRUGS.map((drug) => ({
  value: drug.id,
  label: drug.label,
}));

export function PediatricAntipyreticCalculatorScreen() {
  const [weightInput, setWeightInput] = useState('');
  const [drugId, setDrugId] = useState<AntipyreticDrugId | null>(null);

  const weightKg = useMemo(() => parseWeightKg(weightInput), [weightInput]);
  const weightError = useMemo(() => {
    const trimmed = weightInput.trim();
    if (!trimmed) return '체중(kg)을 입력해 주세요.';
    if (weightKg === null) return '올바른 체중 숫자를 입력해 주세요. (예: 12.5)';
    return null;
  }, [weightInput, weightKg]);

  const result = useMemo(() => {
    if (!drugId || weightKg === null) return null;
    return calculatePediatricAntipyretic(weightKg, drugId);
  }, [drugId, weightKg]);

  const showResult = result !== null && drugId !== null && weightKg !== null;

  return (
    <UtilityToolShell>
      <View className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <Text className="text-sm leading-6 text-sky-900">
          체중과 약물을 선택하면 1회 권장 복용량(mL) 범위를 계산합니다. 아세트아미노펜 시럽 32mg/mL,
          이부프로펜 시럽 20mg/mL 기준입니다. 실제 투여 전 의료진·약사 상담이 필요합니다.
        </Text>
      </View>

      <UtilityFormField
        label="체중 (kg)"
        placeholder="예: 12.5"
        hint="소아 체중을 kg 단위로 입력하세요."
        value={weightInput}
        onChangeText={setWeightInput}
      />

      <UtilitySelectField
        label="약물 선택"
        placeholder="약물을 선택하세요"
        hint="아세트아미노펜 또는 이부프로펜"
        options={DRUG_OPTIONS}
        value={drugId}
        onChange={setDrugId}
      />

      <UtilityResultCard title="계산 결과">
        {!drugId ? (
          <Text className="text-sm text-kemix-text-secondary">약물을 선택하면 결과가 표시됩니다.</Text>
        ) : weightError ? (
          <Text className="text-sm text-amber-700">{weightError}</Text>
        ) : showResult && result ? (
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
                <Text className="text-[11px] font-semibold text-kemix-text-secondary">투여 간격</Text>
                <Text className="mt-1 text-sm font-bold text-kemix-text">
                  {result.drug.intervalLabel}
                </Text>
              </View>
              <View className="flex-1 rounded-xl border border-kemix-border-light bg-kemix-bg px-3 py-3">
                <Text className="text-[11px] font-semibold text-kemix-text-secondary">1일 최대 횟수</Text>
                <Text className="mt-1 text-sm font-bold text-kemix-text">
                  최대 {result.drug.maxDailyDoses}회
                </Text>
              </View>
            </View>

            <Text className="text-[11px] leading-5 text-kemix-muted">
              체중 {result.weightKg} kg ·{' '}
              {result.drug.id === 'acetaminophen' ? '10~15 mg/kg/회' : '5~10 mg/kg/회 (소아)'}
              기준 참고 계산입니다.
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-kemix-text-secondary">체중과 약물을 입력하면 결과가 표시됩니다.</Text>
        )}
      </UtilityResultCard>
    </UtilityToolShell>
  );
}
