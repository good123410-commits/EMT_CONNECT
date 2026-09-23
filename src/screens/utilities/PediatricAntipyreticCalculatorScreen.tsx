import { useMemo, useState } from 'react';
import { PediatricAntipyreticDrugPicker } from '@/components/utilities/PediatricAntipyreticDrugPicker';
import { PediatricAntipyreticDoseTimerCard } from '@/components/utilities/PediatricAntipyreticDoseTimerCard';
import { PediatricAntipyreticGuideCard } from '@/components/utilities/PediatricAntipyreticGuideCard';
import { PediatricAntipyreticResultAccordion } from '@/components/utilities/PediatricAntipyreticResultAccordion';
import { UtilityFormField } from '@/components/utilities/UtilityFormField';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';
import { usePediatricAntipyreticDoseTimer } from '@/hooks/usePediatricAntipyreticDoseTimer';
import {
  calculatePediatricAntipyretic,
  parseWeightKg,
  type AntipyreticDrugFamily,
} from '@/utils/pediatricAntipyreticCalc';

export function PediatricAntipyreticCalculatorScreen() {
  const [weightInput, setWeightInput] = useState('');
  const [family, setFamily] = useState<AntipyreticDrugFamily | null>(null);

  const weightKg = useMemo(() => parseWeightKg(weightInput), [weightInput]);
  const weightError = useMemo(() => {
    const trimmed = weightInput.trim();
    if (!trimmed) return '체중(kg)을 입력해 주세요.';
    if (weightKg === null) return '올바른 체중 숫자를 입력해 주세요. (예: 12.5)';
    return null;
  }, [weightInput, weightKg]);

  const result = useMemo(() => {
    if (!family || weightKg === null) return null;
    return calculatePediatricAntipyretic(weightKg, family);
  }, [family, weightKg]);

  const {
    history,
    schedule,
    now,
    recording,
    resetting,
    alert,
    recordDose,
    resetHistory,
    dismissAlert,
  } = usePediatricAntipyreticDoseTimer(family);

  return (
    <UtilityToolShell>
      <PediatricAntipyreticGuideCard />

      <UtilityFormField
        label="체중 (kg)"
        placeholder="예: 12.5"
        hint="소아 체중을 kg 단위로 입력하세요."
        value={weightInput}
        onChangeText={setWeightInput}
      />

      <PediatricAntipyreticDrugPicker value={family} onChange={setFamily} />

      <PediatricAntipyreticResultAccordion
        family={family}
        weightError={weightError}
        result={result}
      />

      <PediatricAntipyreticDoseTimerCard
        family={family}
        schedule={schedule}
        history={history}
        now={now}
        recording={recording}
        resetting={resetting}
        alert={alert}
        onRecordDose={() => void recordDose()}
        onResetHistory={resetHistory}
        onDismissAlert={dismissAlert}
      />
    </UtilityToolShell>
  );
}
