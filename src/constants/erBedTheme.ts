import { useMemo } from 'react';
import type { AppThemeMode } from '@/constants/appThemes';
import type { ErStatus } from '@/mockData/aedAndEmergency';
import { useThemedColors } from '@/hooks/useThemedColors';

export type ErBedStatusPalette = Record<ErStatus, string> & {
  empty: string;
  skeleton: string;
  unavailable: string;
};

const LIGHT_PALETTE: ErBedStatusPalette = {
  available: '#16a34a',
  congested: '#ea580c',
  full: '#dc2626',
  empty: '#94a3b8',
  skeleton: '#e2e8f0',
  unavailable: '#64748b',
};

const DARK_PALETTE: ErBedStatusPalette = {
  available: '#4ade80',
  congested: '#fb923c',
  full: '#f87171',
  empty: '#9ca3af',
  skeleton: '#2e2e2e',
  unavailable: '#9ca3af',
};

const BEIGE_PALETTE: ErBedStatusPalette = {
  available: '#15803d',
  congested: '#c2410c',
  full: '#b91c1c',
  empty: '#7a6b5d',
  skeleton: '#ddd5c8',
  unavailable: '#6b5a48',
};

export function getErBedStatusPalette(mode: AppThemeMode): ErBedStatusPalette {
  switch (mode) {
    case 'light':
      return LIGHT_PALETTE;
    case 'beige':
      return BEIGE_PALETTE;
    default:
      return DARK_PALETTE;
  }
}

/** 응급실 병상 가용 상태별 테마 색상 */
export function useErBedStatusPalette(): ErBedStatusPalette {
  const { mode } = useThemedColors();
  return useMemo(() => getErBedStatusPalette(mode), [mode]);
}
