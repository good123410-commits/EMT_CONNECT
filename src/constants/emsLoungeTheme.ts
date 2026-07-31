/** EMS 커뮤니티(히든 라운지) — 앱 다크 테마와 정렬 */

export const EMS_LOUNGE = {
  /** 제목·강조 텍스트 (레거시 alias: navy) */
  navy: '#FFFFFF',
  text: '#FFFFFF',
  navyMid: '#242424',
  accent: '#3B82F6',
  accentSoft: '#60A5FA',
  accentMuted: '#1A2332',
  green: '#34D399',
  greenSoft: '#1A2E28',
  background: '#121212',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
  border: '#2E2E2E',
  borderLight: '#333333',
  error: '#F87171',
  errorBg: '#2A1A1A',
  amberBg: '#2A2218',
  amberText: '#FBBF24',
} as const;

export const EMS_LOUNGE_SHADOW = {
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
} as const;

export const EMS_LOUNGE_SPACING = {
  screen: 32,
  cardGap: 20,
  screenTop: 8,
  cardPadding: 24,
  headerBottom: 12,
} as const;

/** 필터 칩 공통 스타일 토큰 */
export const EMS_LOUNGE_CHIP = {
  activeBg: EMS_LOUNGE.accent,
  activeText: '#FFFFFF',
  inactiveBg: EMS_LOUNGE.surfaceElevated,
  inactiveText: EMS_LOUNGE.textSecondary,
  inactiveBorder: EMS_LOUNGE.border,
  radius: 999,
  paddingHorizontal: 16,
  paddingVertical: 9,
} as const;
