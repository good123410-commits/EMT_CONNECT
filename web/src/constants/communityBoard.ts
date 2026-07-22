export const BOARD_PAGE_SIZE = 15;

export const BOARD_FILTER_TABS = [
  { id: 'all', label: '전체', slug: null },
  { id: 'daily-best', label: '🔥 일간 베스트 10', slug: null, dailyBest: true },
  { id: 'free', label: '자유', slug: 'free' },
  { id: 'question', label: '질문&답변', slug: 'question' },
  { id: 'field', label: '현장 이야기', slug: 'field' },
  { id: 'info', label: '정보공유', slug: 'info' },
] as const;

export type BoardFilterId = (typeof BOARD_FILTER_TABS)[number]['id'];

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  free: '자유',
  question: '질문&답변',
  field: '현장 이야기',
  info: '정보공유',
  general: '자유',
};

export function getCategoryLabel(slug: string | null | undefined, name?: string | null): string {
  if (slug && CATEGORY_DISPLAY_NAMES[slug]) return CATEGORY_DISPLAY_NAMES[slug];
  if (name === '질문') return '질문&답변';
  if (name === '정보') return '정보공유';
  return name ?? '자유';
}
