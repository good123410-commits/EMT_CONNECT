export type NavChild = { to: string; label: string };
export type NavItem =
  | { label: string; to: string; end?: boolean }
  | { label: string; children: NavChild[] };

export const ABOUT_TABS = [
  { to: '/about/vision', label: '케믹스 비전', end: true },
  { to: '/about/history', label: '케믹스 연혁', end: true },
  { to: '/about/structure', label: '케믹스 구성', end: true },
  { to: '/about/dev-log', label: '개발일지', end: true },
  { to: '/about/members', label: '회원 목록', end: true },
] as const;

export const DOWNLOAD_TABS = [
  { to: '/download/resources', label: '자료실', end: true },
  { to: '/download/app', label: '앱 다운로드', end: true },
  { to: '/download/faq', label: '자주하는 질문', end: true },
] as const;

export const MAIN_NAV: NavItem[] = [
  {
    label: 'KEMIX 소개',
    children: [
      { to: '/about/vision', label: '케믹스 비전' },
      { to: '/about/history', label: '케믹스 연혁' },
      { to: '/about/structure', label: '케믹스 구성' },
      { to: '/about/dev-log', label: '개발일지' },
      { to: '/about/members', label: '회원 목록' },
    ],
  },
  {
    label: 'KEMIX 콘텐츠',
    children: [
      { to: '/content/interview', label: '이달의 인터뷰' },
      { to: '/content/schedule', label: 'KEMIX 일정' },
      { to: '/content/training', label: 'KEMIX 교육 안내' },
    ],
  },
  { label: '생활 응급처치 가이드', to: '/blog' },
  {
    label: 'KEMIX 커뮤니티',
    children: [
      { to: '/community/board', label: '자유게시판' },
      { to: '/community/qna', label: 'EMS 질문하기' },
      // { to: '/community/skills', label: '스킬 테크 트리' },
      { to: '/community/polls', label: 'KEMIX 투표' },
      { to: '/community/donation', label: '모금 계좌 안내' },
      { to: '/community/fund-usage', label: '기금 사용 안내' },
    ],
  },
  {
    label: '자료실 & 질문하기',
    children: [
      { to: '/download/resources', label: '자료실' },
      { to: '/download/app', label: '앱 다운로드' },
      { to: '/download/faq', label: '자주하는 질문' },
      { to: '/community/qna', label: 'EMS 질문하기' },
    ],
  },
];

export const COMMUNITY_TABS = [
  { to: '/community/board', label: '자유게시판' },
  { to: '/community/qna', label: 'EMS 질문하기' },
  // { to: '/community/skills', label: '스킬 테크 트리' },
  { to: '/community/polls', label: 'KEMIX 투표' },
  { to: '/community/donation', label: '모금 계좌 안내' },
  { to: '/community/fund-usage', label: '기금 사용 안내' },
] as const;

export const CONTENT_TABS = [
  { to: '/content/interview', label: '🎤 이달의 인터뷰', end: true },
  { to: '/content/schedule', label: '📅 KEMIX 일정', end: true },
  { to: '/content/training', label: '🎓 KEMIX 교육 안내', end: false },
] as const;
