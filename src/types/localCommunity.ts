export type LocalCommunityCategory =
  | 'pediatric_wait'
  | 'night_clinic'
  | 'emergency_parenting';

export type LocalCommunityPost = {
  id: string;
  /** 시·군·구 게시판 코드 (예: seoul-gangnam, jeonnam-muan) */
  regionCode: string;
  category: LocalCommunityCategory;
  content: string;
  anonymousLabel: string;
  authorId?: string | null;
  createdAt: string;
  expiresAt: string;
  reportCount: number;
  isBlinded: boolean;
  /** v1 생활권 마이그레이션 잔여 필드 */
  livingAreaId?: string;
};

export type LocalCommunityStore = {
  posts: LocalCommunityPost[];
};

export type LocalCommunityRoom = {
  id: string;
  regionCode: string;
  title: string;
  topic: string | null;
  category: LocalCommunityCategory | null;
  description: string | null;
  creatorLabel: string;
  messageCount: number;
  participantCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
};

export type LocalCommunityMessage = {
  id: string;
  roomId: string;
  content: string;
  anonymousLabel: string;
  authorId?: string | null;
  createdAt: string;
  reportCount: number;
  isBlinded: boolean;
};

export const LOCAL_COMMUNITY_CATEGORY_LABELS: Record<LocalCommunityCategory, string> = {
  pediatric_wait: '실시간 소아과 대기',
  night_clinic: '야간 진료 공유',
  emergency_parenting: '응급/육아 소통',
};

export const LOCAL_COMMUNITY_CATEGORIES: LocalCommunityCategory[] = [
  'pediatric_wait',
  'night_clinic',
  'emergency_parenting',
];

