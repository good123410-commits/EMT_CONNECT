import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { ATTENDANCE_REWARD, getTodayQuiz } from '@/mockData/rewards/quizzes';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function AttendanceQuizModule() {
  const [showQuiz, setShowQuiz] = useState(false);

  return (
    <View className="gap-4">
      <AttendanceCalendar />
      <DailyQuizSection showQuiz={showQuiz} onToggle={() => setShowQuiz((v) => !v)} />
    </View>
  );
}

function AttendanceCalendar() {
  const { attendanceDates, checkIn, hasCheckedInToday, streak } = useWallet();

  const { year, month, days, startOffset } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    return { year: y, month: m, days: totalDays, startOffset: firstDay };
  }, []);

  const today = new Date().getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-slate-900">
          {year}년 {month + 1}월 출석체크
        </Text>
        <Text className="text-xs text-slate-500">+{ATTENDANCE_REWARD}P / 일</Text>
      </View>

      <View className="mb-2 flex-row">
        {WEEKDAYS.map((d) => (
          <Text key={d} className="flex-1 text-center text-xs font-medium text-slate-400">
            {d}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} className="aspect-square w-[14.28%]" />;
          }
          const checked = attendanceDates.includes(dateKey(day));
          const isToday = day === today;
          return (
            <View key={day} className="aspect-square w-[14.28%] items-center justify-center p-0.5">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  checked ? 'bg-green-500' : isToday ? 'border-2 border-slate-900' : 'bg-slate-50'
                }`}
              >
                {checked ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text className={`text-xs ${isToday ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                    {day}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        className={`mt-4 items-center rounded-xl py-3 ${hasCheckedInToday ? 'bg-slate-100' : 'bg-slate-900'}`}
        onPress={checkIn}
        disabled={hasCheckedInToday}
      >
        <Text className={`font-semibold ${hasCheckedInToday ? 'text-slate-400' : 'text-white'}`}>
          {hasCheckedInToday ? '오늘 출석 완료 ✓' : `출석체크 (+${ATTENDANCE_REWARD}P)`}
        </Text>
      </Pressable>
      {streak >= 3 ? (
        <Text className="mt-2 text-center text-xs text-orange-600">
          🔥 {streak}일 연속 출석! 보너스 +5P 적용
        </Text>
      ) : null}
    </View>
  );
}

function DailyQuizSection({
  showQuiz,
  onToggle,
}: {
  showQuiz: boolean;
  onToggle: () => void;
}) {
  const quiz = getTodayQuiz();
  const { hasCompletedQuizToday } = useWallet();

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <Pressable className="flex-row items-center justify-between" onPress={onToggle}>
        <View className="flex-1">
          <View className="flex-row items-center">
            <View className="rounded-full bg-blue-100 px-2 py-0.5">
              <Text className="text-xs font-bold text-blue-700">{quiz.category}</Text>
            </View>
            {hasCompletedQuizToday ? (
              <Text className="ml-2 text-xs font-semibold text-green-600">완료</Text>
            ) : null}
          </View>
          <Text className="mt-2 text-base font-bold text-slate-900">오늘의 퀴즈</Text>
          <Text className="mt-1 text-sm text-slate-500" numberOfLines={2}>
            {quiz.question}
          </Text>
          <Text className="mt-2 text-xs text-slate-400">정답 시 +{quiz.rewardPoints}P</Text>
        </View>
        <Ionicons name={showQuiz ? 'chevron-up' : 'chevron-down'} size={22} color="#94a3b8" />
      </Pressable>
      {showQuiz ? <QuizForm quiz={quiz} /> : null}
    </View>
  );
}

function QuizForm({ quiz }: { quiz: ReturnType<typeof getTodayQuiz> }) {
  const { completeQuiz, hasCompletedQuizToday } = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selected === quiz.correctOptionId;

  const handleSubmit = () => {
    if (!selected || hasCompletedQuizToday) return;
    setSubmitted(true);
    if (isCorrect) completeQuiz(quiz.rewardPoints);
  };

  return (
    <View className="mt-4 border-t border-slate-100 pt-4">
      {quiz.options.map((opt) => {
        const isSelected = selected === opt.id;
        let borderColor = 'border-slate-200';
        if (submitted && opt.id === quiz.correctOptionId) borderColor = 'border-green-500 bg-green-50';
        else if (submitted && isSelected && !isCorrect) borderColor = 'border-red-400 bg-red-50';
        else if (isSelected) borderColor = 'border-slate-900 bg-slate-50';

        return (
          <Pressable
            key={opt.id}
            className={`mb-2 rounded-xl border p-3 ${borderColor}`}
            onPress={() => !submitted && !hasCompletedQuizToday && setSelected(opt.id)}
            disabled={submitted || hasCompletedQuizToday}
          >
            <Text className="text-sm text-slate-800">{opt.text}</Text>
          </Pressable>
        );
      })}

      {submitted || hasCompletedQuizToday ? (
        <View className="mt-2 rounded-xl bg-slate-50 p-3">
          <Text className="text-sm font-semibold text-slate-800">
            {hasCompletedQuizToday && !submitted
              ? '오늘 퀴즈를 이미 완료했습니다.'
              : isCorrect
                ? '정답입니다! 🎉'
                : '오답입니다.'}
          </Text>
          <Text className="mt-1 text-xs leading-5 text-slate-600">{quiz.explanation}</Text>
        </View>
      ) : (
        <Pressable
          className={`mt-2 items-center rounded-xl py-3 ${selected ? 'bg-blue-600' : 'bg-slate-200'}`}
          onPress={handleSubmit}
          disabled={!selected}
        >
          <Text className={`font-semibold ${selected ? 'text-white' : 'text-slate-400'}`}>제출하기</Text>
        </Pressable>
      )}
    </View>
  );
}
