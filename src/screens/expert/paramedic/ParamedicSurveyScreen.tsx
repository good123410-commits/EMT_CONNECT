import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { SegmentControl } from '@/components/SegmentControl';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useWallet } from '@/contexts/WalletContext';
import { PARAMEDIC_SURVEYS, SPONSORSHIP_TIERS } from '@/mockData/rewards/paramedicSurveys';
import type { Survey } from '@/mockData/rewards/surveys';

type SurveyTab = 'survey' | 'sponsor';

function ParamedicSurveyForm({ survey, onBack }: { survey: Survey; onBack: () => void }) {
  const { completeSurvey } = useWallet();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useHardwareBackHandler(onBack, true);

  const allAnswered = survey.questions.every((q) => answers[q.id]);

  const handleSubmit = () => {
    if (!allAnswered) return;
    completeSurvey(survey.id, survey.rewardPoints);
    setSubmitted(true);
  };

  return (
    <ScrollView contentContainerClassName="p-4 pb-28">
      <Pressable className="mb-4 flex-row items-center" onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#14532d" />
        <Text className="ml-2 font-semibold text-green-900">설문 목록</Text>
      </Pressable>

      <View className="rounded-2xl border border-green-200 bg-white p-4">
        <Text className="text-lg font-bold text-slate-900">{survey.title}</Text>
        <Text className="mt-1 text-sm text-slate-500">{survey.description}</Text>
        <Text className="mt-2 text-xs font-semibold text-green-700">
          완료 시 +{survey.rewardPoints}P 적립
        </Text>
      </View>

      {survey.questions.map((q, idx) => (
        <View key={q.id} className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-sm font-bold text-slate-900">
            {idx + 1}. {q.question}
          </Text>
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt;
            return (
              <Pressable
                key={opt}
                className={`mt-2 rounded-xl border p-3 ${selected ? 'border-green-700 bg-green-50' : 'border-slate-200'}`}
                onPress={() => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                disabled={submitted}
              >
                <Text className="text-sm text-slate-700">{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      {submitted ? (
        <View className="mt-4 items-center rounded-2xl bg-green-50 p-6">
          <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
          <Text className="mt-2 text-lg font-bold text-green-800">설문 완료!</Text>
          <Text className="mt-1 text-sm text-green-700">+{survey.rewardPoints}P가 적립되었습니다.</Text>
          <Pressable className="mt-4 rounded-xl bg-green-700 px-6 py-3" onPress={onBack}>
            <Text className="font-semibold text-white">목록으로</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          className={`mt-4 items-center rounded-xl py-4 ${allAnswered ? 'bg-green-700' : 'bg-slate-200'}`}
          onPress={handleSubmit}
          disabled={!allAnswered}
        >
          <Text className={`font-bold ${allAnswered ? 'text-white' : 'text-slate-400'}`}>
            제출하고 {survey.rewardPoints}P 받기
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function SponsorshipPanel() {
  const handleSponsor = (name: string, amount: number) => {
    Alert.alert(
      '후원 안내',
      `${name} (${amount.toLocaleString()}원)\n\n응급의료 발전 기금으로 전달됩니다. 실제 결제는 추후 연동 예정입니다.`,
      [{ text: '확인' }],
    );
  };

  return (
    <View className="gap-3">
      <View className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <Text className="text-base font-bold text-green-900">응급의료 발전 후원</Text>
        <Text className="mt-2 text-sm leading-5 text-green-800">
          현장 구급대원의 장비 개선, 교육 프로그램, 응급의료 인프라 확충을 위한 후원에
          동참해 주세요.
        </Text>
      </View>

      {SPONSORSHIP_TIERS.map((tier) => (
        <View key={tier.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center">
            <Text className="text-3xl">{tier.emoji}</Text>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-slate-900">{tier.name}</Text>
              <Text className="mt-0.5 text-xs text-slate-500">{tier.description}</Text>
            </View>
            <Text className="text-lg font-bold text-green-700">
              {tier.amount.toLocaleString()}원
            </Text>
          </View>
          <Pressable
            className="mt-3 items-center rounded-xl bg-green-700 py-3"
            onPress={() => handleSponsor(tier.name, tier.amount)}
          >
            <Text className="font-semibold text-white">후원하기</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function ParamedicSurveyScreen() {
  const [tab, setTab] = useState<SurveyTab>('survey');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const { completedSurveyIds } = useWallet();

  if (selectedSurvey) {
    return (
      <View className="flex-1 bg-green-50/30">
        <ParamedicHeader subtitle="설문/후원 · 현장 개선 조사" />
        <ParamedicSurveyForm survey={selectedSurvey} onBack={() => setSelectedSurvey(null)} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-50/30">
      <ParamedicHeader subtitle="설문/후원 · 현장 개선 조사" />

      <View className="border-b border-green-200 bg-white px-4 py-3">
        <SegmentControl
          options={[
            { value: 'survey', label: '전문가 설문' },
            { value: 'sponsor', label: '응급의료 후원' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-28 gap-3">
        {tab === 'survey' ? (
          PARAMEDIC_SURVEYS.map((survey) => {
            const done = completedSurveyIds.includes(survey.id);
            return (
              <Pressable
                key={survey.id}
                className={`rounded-2xl border p-4 ${done ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white active:bg-slate-50'}`}
                onPress={() => !done && setSelectedSurvey(survey)}
                disabled={done}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{survey.title}</Text>
                    <Text className="mt-1 text-sm text-slate-500">{survey.description}</Text>
                    <View className="mt-3 flex-row items-center gap-3">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text className="ml-1 text-xs text-slate-500">약 {survey.estimatedMin}분</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="gift-outline" size={14} color="#64748b" />
                        <Text className="ml-1 text-xs font-semibold text-green-600">
                          +{survey.rewardPoints}P
                        </Text>
                      </View>
                    </View>
                  </View>
                  {done ? (
                    <View className="rounded-full bg-green-600 px-2 py-1">
                      <Text className="text-xs font-bold text-white">완료</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  )}
                </View>
              </Pressable>
            );
          })
        ) : (
          <SponsorshipPanel />
        )}
      </ScrollView>
    </View>
  );
}
