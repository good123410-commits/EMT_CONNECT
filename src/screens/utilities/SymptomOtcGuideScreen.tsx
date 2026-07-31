import { Text, View } from 'react-native';
import { UtilityFormField } from '@/components/utilities/UtilityFormField';
import { UtilityResultCard } from '@/components/utilities/UtilityResultCard';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';

const SAMPLE_SYMPTOMS = ['두통·몸살', '소화불량', '피부 가려움', '콧물·재채기'];

export function SymptomOtcGuideScreen() {
  return (
    <UtilityToolShell>
      <View className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <Text className="text-sm leading-6 text-emerald-900">
          증상을 검색하거나 선택하면 일반의약품(OTC) 참고 정보를 제공합니다. 전문의 진료·처방을
          대체하지 않습니다.
        </Text>
      </View>

      <UtilityFormField
        label="증상 검색"
        placeholder="예: 기침, 설사, 발열"
        hint="증상 키워드 입력 후 추천 목록이 표시됩니다."
      />

      <Text className="mb-2 text-sm font-semibold text-kemix-text">자주 찾는 증상</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {SAMPLE_SYMPTOMS.map((symptom) => (
          <View
            key={symptom}
            className="rounded-full border border-kemix-border bg-kemix-surface px-3 py-2"
          >
            <Text className="text-xs font-medium text-kemix-text-secondary">{symptom}</Text>
          </View>
        ))}
      </View>

      <UtilityResultCard title="추천 상비약 (미리보기)">
        <Text className="text-sm text-kemix-text-secondary">
          성분, 복용 연령, 주의사항, 약국·편의점 구분이 리스트로 표시됩니다.
        </Text>
        <View className="mt-3 gap-2">
          {[1, 2, 3].map((row) => (
            <View key={row} className="rounded-xl border border-kemix-border-light bg-kemix-bg px-3 py-3">
              <Text className="text-xs font-semibold text-kemix-text-secondary">추천 항목 {row}</Text>
              <Text className="mt-1 text-sm text-kemix-muted">상품명 · 성분 · 복용 팁 Placeholder</Text>
            </View>
          ))}
        </View>
      </UtilityResultCard>
    </UtilityToolShell>
  );
}
