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

export type CaseStudyPost = {
  id: string;
  title: string;
  anonymousLabel: string;
  summary: string;
  body: string;
  tags: string[];
  postedAt: string;
  likes: number;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  anonymousLabel: string;
  content: string;
  postedAt: string;
};

export type ResourceDocument = {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  updatedAt: string;
  isExternal?: boolean;
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

export const CASE_STUDY_POSTS: CaseStudyPost[] = [
  {
    id: 'cs-1',
    title: '심정지 현장 ROSC 후 전원 거절 대응',
    anonymousLabel: '경기 · 6년차',
    summary: '요양병원 심정지 환자 ROSC 후 ICU bed 부재로 2차 병원 거절 — 전원 협의 절차 정리',
    body: '현장 ROSC 후 1차 병원 ER 도착, ICU bed 없음 통보. 2차·3차 병원 사전 연락 시 bed 확인 질문 리스트를 미리 정리해 두면 거절률이 줄었습니다. 환자 식별 정보는 익명 처리했습니다.',
    tags: ['케이스스터디', '전원', 'ROSC'],
    postedAt: '2시간 전',
    likes: 18,
  },
  {
    id: 'cs-2',
    title: '소아 기도이물 현장 처치 후기 (익명)',
    anonymousLabel: '서울 · 4년차',
    summary: '소아 기도이물 의심 — BVM 보조 및 이송 중 SpO2 모니터링 포인트',
    body: '소아 환자 기도이물 의심 콜. 산소포화도 추이와 자세 유지가 핵심이었습니다. 병원 도착 전 간호 인계 시 모니터링 수치를 시간순으로 공유했습니다.',
    tags: ['케이스스터디', '소아', '기도'],
    postedAt: '5시간 전',
    likes: 27,
  },
  {
    id: 'cs-3',
    title: '다발 외상 현장 triage 메모',
    anonymousLabel: '부산 · 8년차',
    summary: '교통사고 다수 환자 — 현장 triage 태깅 및 2차 이송 우선순위',
    body: '경상 환자와 중증 환자 분리 후 119 지휘 체계에 맞춰 태깅. 현장 사진·환자 정보는 게시하지 않았으며 절차만 공유합니다.',
    tags: ['케이스스터디', '외상', 'triage'],
    postedAt: '1일 전',
    likes: 34,
  },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'cm-1',
    roomId: 'all',
    anonymousLabel: '익명 · 서울',
    content: '오늘 밤 통합방 — 전국 ER 혼잡도 공유해요. 개인정보·병원 실명은 올리지 말아주세요.',
    postedAt: '10분 전',
  },
  {
    id: 'cm-2',
    roomId: 'seoul',
    anonymousLabel: '익명 · 강남',
    content: '서울권 ○○권역 야간 2인1조 미확보 센터 있다는 제보 있음. 면접 때 확인 권장.',
    postedAt: '25분 전',
  },
  {
    id: 'cm-3',
    roomId: 'gyeonggi',
    anonymousLabel: '익명 · 수원',
    content: '경기 서부권 장거리 이송 많은 날입니다. 교대 조 확인하세요.',
    postedAt: '40분 전',
  },
  {
    id: 'cm-4',
    roomId: 'busan',
    anonymousLabel: '익명 · 해운대',
    content: '부산 ER 대기시간 양호. 전원 문의 시 triage 레벨 먼저 공유 부탁.',
    postedAt: '1시간 전',
  },
  {
    id: 'cm-5',
    roomId: 'other',
    anonymousLabel: '익명 · 광주',
    content: '영남·호남권 소속 대원들 환영합니다. 지역별 장비 입고 정보도 공유해요.',
    postedAt: '2시간 전',
  },
];

export const RESOURCE_DOCUMENTS: ResourceDocument[] = [
  {
    id: 'rd-1',
    title: '2025 응급의료 현장 처치 가이드라인 (요약)',
    category: '프로토콜',
    description: '최신 응급의료 현장 처치 핵심 프로토콜 요약본',
    url: 'https://example.com/mirae-ems/protocol-2025.pdf',
    updatedAt: '2025-03',
  },
  {
    id: 'rd-2',
    title: '미래회 학술대회 공지',
    category: '학술회',
    description: '연간 학술대회 일정·등록 안내 (외부 웹)',
    url: 'https://example.com/mirae-ems/conference',
    updatedAt: '2025-06',
    isExternal: true,
  },
  {
    id: 'rd-3',
    title: '응급구조사 법정 교육 자료',
    category: '교육',
    description: '보수교육·법정교육 참고 자료 목록',
    url: 'https://example.com/mirae-ems/education',
    updatedAt: '2025-01',
    isExternal: true,
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
