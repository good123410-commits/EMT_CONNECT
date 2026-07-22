import type { KemiPost, KemiPostSummary } from '@/types/kemiPost';

/** 웹·앱 공용 가이드(블로그) 요약 타입 — Supabase `kemi_posts` */
export type KemiGuideSummary = KemiPostSummary;

/** 웹·앱 공용 가이드(블로그) 상세 타입 */
export type KemiGuide = KemiPost;

export const KEMI_POSTS_TABLE = 'kemi_posts';
