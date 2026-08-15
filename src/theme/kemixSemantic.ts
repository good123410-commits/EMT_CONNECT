import type { AppColorPalette, AppThemeMode } from '@/constants/appThemes';

/** KEMIX 시맨틱 상태 색 — design-system/kemix/MASTER.md */
export type KemixStatusTone = {
  fg: string;
  bg: string;
  border: string;
  icon: string;
};

export type KemixStatusColors = {
  gps: KemixStatusTone;
  night: KemixStatusTone;
  open: KemixStatusTone;
  closed: KemixStatusTone;
  er: KemixStatusTone;
};

export const KEMIX_TOUCH_MIN_HEIGHT = 44;

const GPS_DARK: KemixStatusTone = {
  fg: '#FCA5A5',
  bg: 'rgba(220, 38, 38, 0.14)',
  border: 'rgba(248, 113, 113, 0.45)',
  icon: '#EF4444',
};

const GPS_LIGHT: KemixStatusTone = {
  fg: '#B91C1C',
  bg: '#FEF2F2',
  border: '#FECACA',
  icon: '#DC2626',
};

const NIGHT_DARK: KemixStatusTone = {
  fg: '#5EEAD4',
  bg: 'rgba(20, 184, 166, 0.1)',
  border: 'rgba(45, 212, 191, 0.28)',
  icon: '#2DD4BF',
};

const NIGHT_LIGHT: KemixStatusTone = {
  fg: '#0F766E',
  bg: '#F0FDFA',
  border: '#CCFBF1',
  icon: '#14B8A6',
};

const OPEN_DARK: KemixStatusTone = {
  fg: '#86EFAC',
  bg: 'rgba(22, 163, 74, 0.12)',
  border: 'rgba(74, 222, 128, 0.35)',
  icon: '#22C55E',
};

const OPEN_LIGHT: KemixStatusTone = {
  fg: '#15803D',
  bg: '#F0FDF4',
  border: '#BBF7D0',
  icon: '#16A34A',
};

const CLOSED_DARK: KemixStatusTone = {
  fg: '#9CA3AF',
  bg: 'rgba(156, 163, 175, 0.1)',
  border: 'rgba(156, 163, 175, 0.25)',
  icon: '#9CA3AF',
};

const CLOSED_LIGHT: KemixStatusTone = {
  fg: '#64748B',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  icon: '#94A3B8',
};

const ER_DARK: KemixStatusTone = {
  fg: '#FCA5A5',
  bg: 'rgba(220, 38, 38, 0.12)',
  border: 'rgba(239, 68, 68, 0.4)',
  icon: '#EF4444',
};

const ER_LIGHT: KemixStatusTone = {
  fg: '#DC2626',
  bg: '#FEF2F2',
  border: '#FECACA',
  icon: '#DC2626',
};

function isDarkPalette(palette: AppColorPalette): boolean {
  return palette.background === '#121212';
}

export function getKemixStatusColors(
  palette: AppColorPalette,
  _mode: AppThemeMode,
): KemixStatusColors {
  const dark = isDarkPalette(palette);

  return {
    gps: dark ? GPS_DARK : GPS_LIGHT,
    night: dark ? NIGHT_DARK : NIGHT_LIGHT,
    open: dark ? OPEN_DARK : OPEN_LIGHT,
    closed: dark ? CLOSED_DARK : CLOSED_LIGHT,
    er: dark ? ER_DARK : ER_LIGHT,
  };
}
