export type BambooMessage = {
  id: string;
  anonymousLabel: string;
  region: string;
  content: string;
  tags: string[];
  postedAt: string;
  likes: number;
  isHot?: boolean;
};

export type JobPost = {
  id: string;
  type: 'hire' | 'seek';
  title: string;
  company: string;
  location: string;
  salary: string;
  schedule: string;
  requirements: string;
  postedAt: string;
  isUrgent?: boolean;
};

export const BAMBOO_MESSAGES: BambooMessage[] = [
  {
    id: 'bm-1',
    anonymousLabel: '강남구 · 3년차',
    region: '서울',
    content: '○○대병원 ER 지금 레드폭주 중. CT 대기 2시간+. 외상 환자 전원 요청 들어오면 바로 거절하세요.',
    tags: ['ER상황', '전원'],
    postedAt: '3분 전',
    likes: 24,
    isHot: true,
  },
  {
    id: 'bm-2',
    anonymousLabel: '수원 · 7년차',
    region: '경기',
    content: '오늘 새벽 콜 — 요양병원에서 심정지 환자, 가족 CPR 10분+. 현장 도착 시 ROSC 됐는데 병원에서 ICU bed 없다고 2곳 거절. 결국 40km 전원.',
    tags: ['현장후기', '전원난'],
    postedAt: '12분 전',
    likes: 41,
    isHot: true,
  },
  {
    id: 'bm-3',
    anonymousLabel: '광주 · 5년차',
    region: '광주',
    content: '최근 BVM 마스크 사이즈 재고 떨어졌는데, ○○센터는 pediatric용만 남았다고 함. 미리 챙기세요.',
    tags: ['장비', '팁'],
    postedAt: '28분 전',
    likes: 15,
  },
  {
    id: 'bm-4',
    anonymousLabel: '부산 · 2년차',
    region: '부산',
    content: '신규 입사 3개월차인데 야간 2인1조 안 되는 센터 아직 많습니다. 면접 때 꼭 확인하세요.',
    tags: ['노무', '조언'],
    postedAt: '45분 전',
    likes: 33,
  },
  {
    id: 'bm-5',
    anonymousLabel: '대전 · 10년차',
    region: '대전',
    content: '○○병원 ER 입구 협소해서 stretcher turnaround 15분+. 119랑 사전 조율하면 입구 임시 확보해줌.',
    tags: ['ER상황', '현장팁'],
    postedAt: '1시간 전',
    likes: 19,
  },
];

export const JOB_POSTS: JobPost[] = [
  {
    id: 'jp-1',
    type: 'hire',
    title: '119 구급대원 채용 (정규직)',
    company: '서울소방재난본부 ○○119안전센터',
    location: '서울 강서구',
    salary: '연봉 4,200~5,100만원',
    schedule: '3교대 · 주 40시간',
    requirements: '응급구조사 1급 · 운전면허 1종 · 신체검사 합격자',
    postedAt: '1일 전',
    isUrgent: true,
  },
  {
    id: 'jp-2',
    type: 'hire',
    title: '사설 구급차 구조사 모집',
    company: '○○이송 EMS',
    location: '경기 수원시',
    salary: '월 320~380만원',
    schedule: '주 4일 · 12시간',
    requirements: '응급구조사 1급 · 2종보통 · 장거리 이송 경력 우대',
    postedAt: '2일 전',
  },
  {
    id: 'jp-3',
    type: 'hire',
    title: '병원 ER 전담 이송팀 구인',
    company: '○○대학교병원 응급의료센터',
    location: '서울 종로구',
    salary: '월 350~420만원 + 야간수당',
    schedule: '2교대 · ER 전담',
    requirements: '응급구조사 1급 · BLS/PALS · 병원 이송 경력 1년+',
    postedAt: '3일 전',
  },
  {
    id: 'jp-4',
    type: 'hire',
    title: '전국 장거리 이송 기사+구조사',
    company: '○○전국이송',
    location: '전국 (거주지 무관)',
    salary: '건당 정산 + 기본급',
    schedule: '주 5~6일 · 장거리',
    requirements: '응급구조사 1급 · 1종대형 · 장거리 운전 경력',
    postedAt: '4일 전',
  },
];

export const ANONYMOUS_LABELS = [
  '익명 · 서울',
  '익명 · 경기',
  '익명 · 부산',
  '익명 · 대구',
  '익명 · 광주',
  '익명 · 대전',
];
