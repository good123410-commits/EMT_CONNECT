/** EMS 커뮤니티(히든 라운지) — 앱 다크 테마와 정렬 */

export const EMS_LOUNGE = {
  navy: '#FFFFFF',
  navyMid: '#1A1A1A',
  green: '#34D399',
  greenSoft: '#1A2E28',
  background: '#121212',
  surface: '#1A1A1A',
  text: '#FFFFFF',
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
  screenTop: 12,
  cardPadding: 24,
} as const;
