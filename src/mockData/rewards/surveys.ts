export type SurveyQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type Survey = {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  estimatedMin: number;
  questions: SurveyQuestion[];
};

export const SURVEYS: Survey[] = [
  {
    id: 'sv1',
    title: '119 신고 경험 조사',
    description: '응급상황 119 신고 경험 및 인식에 관한 짧은 설문입니다.',
    rewardPoints: 50,
    estimatedMin: 2,
    questions: [
      {
        id: 'sv1q1',
        question: '최근 1년 내 119에 신고한 경험이 있습니까?',
        options: ['있다', '없다'],
      },
      {
        id: 'sv1q2',
        question: '119 신고 시 가장 어려웠던 점은?',
        options: ['위치 설명', '환자 상태 설명', '대기 시간', '해당 없음'],
      },
    ],
  },
  {
    id: 'sv2',
    title: 'AED 설치 인식 설문',
    description: '공공장소 AED 인식도 및 접근성에 대한 설문입니다.',
    rewardPoints: 40,
    estimatedMin: 3,
    questions: [
      {
        id: 'sv2q1',
        question: '주변에서 AED 위치를 알고 계십니까?',
        options: ['안다', '대략 안다', '모른다'],
      },
      {
        id: 'sv2q2',
        question: 'AED 사용 교육을 받은 적이 있습니까?',
        options: ['있다', '없다', '기억나지 않음'],
      },
      {
        id: 'sv2q3',
        question: 'AED 사용 시 가장 우려되는 점은?',
        options: ['오작동', '법적 책임', '사용법 모름', '없음'],
      },
    ],
  },
  {
    id: 'sv3',
    title: '응급의료 앱 이용 의향',
    description: 'EMS_Connect 앱 기능 및 개선 의견을 수집합니다.',
    rewardPoints: 60,
    estimatedMin: 4,
    questions: [
      {
        id: 'sv3q1',
        question: '응급처치 가이드 앱을 사용할 의향이 있습니까?',
        options: ['매우 있다', '있다', '보통', '없다'],
      },
      {
        id: 'sv3q2',
        question: '가장 유용할 것 같은 기능은?',
        options: ['응급처치 가이드', 'AED 지도', '포인트 리워드', '전문가 커뮤니티'],
      },
    ],
  },
];
