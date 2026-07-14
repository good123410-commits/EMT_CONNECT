import type { Survey } from '@/mockData/rewards/surveys';

export const PARAMEDIC_SURVEYS: Survey[] = [
  {
    id: 'psv1',
    title: '현재 구급대원 보호 장비 만족도 조사',
    description: '현장에서 착용하는 보호 장비(안전화, 장갑, 반사조끼 등)의 품질과 개선 필요 사항을 조사합니다.',
    rewardPoints: 100,
    estimatedMin: 3,
    questions: [
      {
        id: 'psv1q1',
        question: '현재 착용 중인 보호 장비 전반적 만족도는?',
        options: ['매우 만족', '만족', '보통', '불만족', '매우 불만족'],
      },
      {
        id: 'psv1q2',
        question: '가장 시급히 개선이 필요한 장비는?',
        options: ['안전화', '장갑', '반사조끼', '헬멧', '기타'],
      },
      {
        id: 'psv1q3',
        question: '장비 교체 주기는 적절합니까?',
        options: ['적절함', '너무 김', '너무 짧음', '잘 모르겠음'],
      },
    ],
  },
  {
    id: 'psv2',
    title: '119 현장 처치 프로토콜 개선 설문',
    description: '현장에서 실제 적용되는 처치 프로토콜의 현실성과 개선 의견을 수집합니다.',
    rewardPoints: 80,
    estimatedMin: 4,
    questions: [
      {
        id: 'psv2q1',
        question: '현행 프로토콜이 현장 상황에 적합합니까?',
        options: ['매우 적합', '적합', '보통', '부적합'],
      },
      {
        id: 'psv2q2',
        question: '프로토콜 준수 시 가장 큰 어려움은?',
        options: ['시간 부족', '장비 부족', '의사소통', '법적 부담', '없음'],
      },
    ],
  },
  {
    id: 'psv3',
    title: '응급실 전원 체계 실태 조사',
    description: '응급실 전원 과정에서 겪는 어려움과 개선 방안에 대한 전문가 설문입니다.',
    rewardPoints: 120,
    estimatedMin: 5,
    questions: [
      {
        id: 'psv3q1',
        question: '최근 1개월 내 전원 거절 경험이 있습니까?',
        options: ['3회 이상', '1~2회', '없음'],
      },
      {
        id: 'psv3q2',
        question: '전원 거절 시 가장 큰 원인은?',
        options: ['병상 부족', '전문의 부재', '행정 문제', '기타'],
      },
      {
        id: 'psv3q3',
        question: '전원 체계 개선을 위해 가장 필요한 것은?',
        options: ['실시간 병상 정보', '전원 전담 창구', '법적 제재', '인센티브'],
      },
    ],
  },
];

export type SponsorshipTier = {
  id: string;
  name: string;
  amount: number;
  emoji: string;
  description: string;
};

export const SPONSORSHIP_TIERS: SponsorshipTier[] = [
  {
    id: 'sp1',
    name: '응급의료 응원',
    amount: 5_000,
    emoji: '💚',
    description: '현장 대원을 위한 장비 개선 기금',
  },
  {
    id: 'sp2',
    name: '119 동료 후원',
    amount: 10_000,
    emoji: '🩺',
    description: '구급대원 교육·훈련 프로그램 지원',
  },
  {
    id: 'sp3',
    name: '응급의료 발전 기금',
    amount: 30_000,
    emoji: '🏥',
    description: '전국 응급의료 인프라 개선 프로젝트',
  },
];
