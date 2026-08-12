/** KEMIX 앱 전역 디자인 토큰 — 기본값은 다크(레거시). 동적 테마는 useAppTheme() 사용 */
import { getAppThemePalette } from '@/constants/appThemes';

export const APP_FONT = {
  regular: 'Pretendard',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const APP_COLORS = getAppThemePalette('dark');

export const APP_RADIUS = {
  sm: 12,
  card: 16,
  cardLg: 20,
  pill: 999,
} as const;

export const APP_SHADOW = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const APP_BORDER = {
  card: {
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
} as const;

/** 기본 여백 — 기존 대비 약 1.6~2배 */
export const APP_SPACING = {
  /** 넓은 화면 패딩 (전체·유틸 등) */
  screen: 32,
  /** 목록·카드 좌우 인셋 — 응급 가이드 탭 `px-4` 와 동일 */
  contentHorizontal: 16,
  section: 36,
  card: 24,
  screenTop: 12,
  listItem: 20,
} as const;

export const APP_ICON_SIZE = {
  sm: 18,
  md: 22,
  lg: 26,
  tab: 24,
} as const;

export const APP_TYPOGRAPHY = {
  display: {
    fontFamily: APP_FONT.bold,
    fontSize: 28,
    lineHeight: 36,
    color: APP_COLORS.textPrimary,
  },
  title: {
    fontFamily: APP_FONT.bold,
    fontSize: 22,
    lineHeight: 30,
    color: APP_COLORS.textPrimary,
  },
  headline: {
    fontFamily: APP_FONT.semibold,
    fontSize: 18,
    lineHeight: 26,
    color: APP_COLORS.textPrimary,
  },
  body: {
    fontFamily: APP_FONT.regular,
    fontSize: 15,
    lineHeight: 22,
    color: APP_COLORS.textPrimary,
  },
  bodyMedium: {
    fontFamily: APP_FONT.medium,
    fontSize: 15,
    lineHeight: 22,
    color: APP_COLORS.textPrimary,
  },
  caption: {
    fontFamily: APP_FONT.regular,
    fontSize: 13,
    lineHeight: 18,
    color: APP_COLORS.textSecondary,
  },
  label: {
    fontFamily: APP_FONT.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: APP_COLORS.textSecondary,
  },
} as const;
