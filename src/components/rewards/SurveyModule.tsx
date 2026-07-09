import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { SURVEYS, type Survey } from '@/mockData/rewards/surveys';

export function SurveyModule() {
  const [selected, setSelected] = useState<Survey | null>(null);
  const { completedSurveyIds } = useWallet();

  if (selected) {
    return <SurveyForm survey={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View className="gap-3">
      {SURVEYS.map((survey) => {
        const done = completedSurveyIds.includes(survey.id);
        return (
          <Pressable
            key={survey.id}
            className={`rounded-2xl border p-4 ${done ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white active:bg-slate-50'}`}
            onPress={() => !done && setSelected(survey)}
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
                <View className="rounded-full bg-green-500 px-2 py-1">
                  <Text className="text-xs font-bold text-white">완료</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function SurveyForm({ survey, onBack }: { survey: Survey; onBack: () => void }) {
  const { completeSurvey } = useWallet();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = survey.questions.every((q) => answers[q.id]);

  const handleSubmit = () => {
    if (!allAnswered) return;
    completeSurvey(survey.id, survey.rewardPoints);
    setSubmitted(true);
  };

  return (
    <ScrollView contentContainerClassName="pb-8">
      <Pressable className="mb-4 flex-row items-center" onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#0f172a" />
        <Text className="ml-2 font-semibold text-slate-900">설문 목록</Text>
      </Pressable>

      <View className="rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-lg font-bold text-slate-900">{survey.title}</Text>
        <Text className="mt-1 text-sm text-slate-500">{survey.description}</Text>
        <Text className="mt-2 text-xs font-semibold text-green-600">
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
                className={`mt-2 rounded-xl border p-3 ${selected ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}
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
          <Pressable className="mt-4 rounded-xl bg-slate-900 px-6 py-3" onPress={onBack}>
            <Text className="font-semibold text-white">목록으로</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          className={`mt-4 items-center rounded-xl py-4 ${allAnswered ? 'bg-slate-900' : 'bg-slate-200'}`}
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
