export type SkillNode = {
  id: string;
  title: string;
  level: 'foundation' | 'intermediate' | 'advanced' | 'expert';
  description: string;
  prerequisites?: string[];
};

export const SKILL_TREE: SkillNode[] = [
  {
    id: 'basic-life-support',
    title: '기본 생명 유지 (BLS)',
    level: 'foundation',
    description: '심폐소생술, 기도 확보, AED 사용 등 응급구조사 1급 필수 역량',
  },
  {
    id: 'trauma-assessment',
    title: '외상 환자 평가',
    level: 'foundation',
    description: '현장 트리아지, 출혈 통제, 골절 고정, 척추 보호',
    prerequisites: ['basic-life-support'],
  },
  {
    id: 'advanced-airway',
    title: '고급 기도 관리',
    level: 'intermediate',
    description: '기관 삽관, 성문외 기도기, 흡인 및 산소 요법',
    prerequisites: ['basic-life-support'],
  },
  {
    id: 'cardiac-emergency',
    title: '심혈관 응급 처치',
    level: 'intermediate',
    description: '심근경색, 부정맥, 쇼크 환자 현장 처치 프로토콜',
    prerequisites: ['basic-life-support', 'trauma-assessment'],
  },
  {
    id: 'pediatric-ems',
    title: '소아 응급 처치',
    level: 'advanced',
    description: '소아 BLS, 소아 기도, 체중별 약물 용량 산정',
    prerequisites: ['basic-life-support', 'advanced-airway'],
  },
  {
    id: 'disaster-response',
    title: '재난·다수사상자 대응',
    level: 'advanced',
    description: 'START/JumpSTART 트리아지, 현장 지휘, 자원 배분',
    prerequisites: ['trauma-assessment'],
  },
  {
    id: 'ems-leadership',
    title: 'EMS 리더십 & 현장 지휘',
    level: 'expert',
    description: '구급대 지휘, 의료지도 연계, 품질관리 및 교육',
    prerequisites: ['disaster-response', 'cardiac-emergency'],
  },
  {
    id: 'innovation-research',
    title: '응급의료 혁신 & 연구',
    level: 'expert',
    description: 'KEMIX 플랫폼 기반 데이터 분석, 표준 프로토콜 개발',
    prerequisites: ['ems-leadership'],
  },
];

export const SKILL_LEVEL_LABELS: Record<SkillNode['level'], string> = {
  foundation: '기초',
  intermediate: '중급',
  advanced: '고급',
  expert: '전문가',
};
