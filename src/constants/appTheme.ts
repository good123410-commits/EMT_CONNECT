/** KEMIX 앱 전역 디자인 토큰 — 다크 모드 리브랜딩 */

export const APP_FONT = {
  regular: 'Pretendard',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const APP_COLORS = {
  /** 메인 배경 — 딥 차콜 */
  background: '#121212',
  /** 카드·시트·탭바 */
  surface: '#1A1A1A',
  /** 세그먼트·칩·입력 필드 트랙 */
  surfaceElevated: '#242424',
  border: '#2E2E2E',
  borderLight: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
  /** 시그니처 블루 — 버튼·활성·링크 */
  blue: '#3B82F6',
  blueSoft: '#60A5FA',
  blueMuted: '#1E3A5F',
  blueLight: '#1A2332',
  /** 레거시 alias — 제목·강조 텍스트 */
  navy: '#FFFFFF',
  navySoft: '#A0A0A0',
  tabActive: '#3B82F6',
  tabInactive: '#6B6B6B',
  accent: '#3B82F6',
  /** 카드 위 반투명 오버레이 */
  overlay: 'rgba(0, 0, 0, 0.55)',
} as const;

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
