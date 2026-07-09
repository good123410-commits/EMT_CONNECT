export type QuizOption = {
  id: string;
  text: string;
};

export type DailyQuiz = {
  id: string;
  category: '응급의학' | '법령';
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  rewardPoints: number;
};

export const DAILY_QUIZZES: DailyQuiz[] = [
  {
    id: 'q1',
    category: '응급의학',
    question: '성인 심폐소생술(CPR) 시 가슴압박의 적정 속도는?',
    options: [
      { id: 'a', text: '분당 60~80회' },
      { id: 'b', text: '분당 100~120회' },
      { id: 'c', text: '분당 140~160회' },
      { id: 'd', text: '분당 30~50회' },
    ],
    correctOptionId: 'b',
    explanation: '2020 AHA 가이드라인: 성인 CPR 가슴압박 속도는 분당 100~120회입니다.',
    rewardPoints: 20,
  },
  {
    id: 'q2',
    category: '법령',
    question: '응급의료에 관한 법률상 "119구급대"의 주요 임무가 아닌 것은?',
    options: [
      { id: 'a', text: '응급환자 이송' },
      { id: 'b', text: '현장 응급처치' },
      { id: 'c', text: '응급실 전문의 진료' },
      { id: 'd', text: '재난·재해 현장 구조' },
    ],
    correctOptionId: 'c',
    explanation: '응급실 전문의 진료는 의료기관의 역할이며, 119구급대는 이송·현장처치·구조 등을 담당합니다.',
    rewardPoints: 20,
  },
  {
    id: 'q3',
    category: '응급의학',
    question: '아나필락시스 1차 약물로 가장 적합한 것은?',
    options: [
      { id: 'a', text: '에피네프린 IM' },
      { id: 'b', text: '디펜히드라민 PO' },
      { id: 'c', text: '덱사메타손 IV' },
      { id: 'd', text: '알buterol 흡입' },
    ],
    correctOptionId: 'a',
    explanation: '아나필락시스의 1차 치료는 에피네프린 근육주사(1:1000)입니다.',
    rewardPoints: 20,
  },
  {
    id: 'q4',
    category: '법령',
    question: '응급구조사 1급 자격 취득 후 응급의료종사자로 등록해야 하는 기관은?',
    options: [
      { id: 'a', text: '보건복지부' },
      { id: 'b', text: '중앙응급의료센터' },
      { id: 'c', text: '시·도지사' },
      { id: 'd', text: '소방청' },
    ],
    correctOptionId: 'c',
    explanation: '응급구조사는 시·도지사에게 응급의료종사자로 등록해야 합니다.',
    rewardPoints: 20,
  },
  {
    id: 'q5',
    category: '응급의학',
    question: 'FAST 검사에서 "A"는 무엇을 의미하나요?',
    options: [
      { id: 'a', text: 'Airway (기도)' },
      { id: 'b', text: 'Arm (팔)' },
      { id: 'c', text: 'Alert (의식)' },
      { id: 'd', text: 'Ambulance (구급차)' },
    ],
    correctOptionId: 'b',
    explanation: 'FAST: Face(얼굴), Arm(팔), Speech(말), Time(시간). Arm은 한쪽 팔 처짐을 확인합니다.',
    rewardPoints: 20,
  },
];

export function getTodayQuiz(): DailyQuiz {
  const day = new Date().getDate();
  return DAILY_QUIZZES[day % DAILY_QUIZZES.length];
}

export const ATTENDANCE_REWARD = 10;
export const ATTENDANCE_STREAK_BONUS = 5;
