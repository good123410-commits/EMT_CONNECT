export type DistanceUnitMode = 'auto' | 'm' | 'km';

export function resolveDistanceUnit(meters: number, mode: DistanceUnitMode): 'm' | 'km' {
  if (mode === 'm') return 'm';
  if (mode === 'km') return 'km';
  return meters >= 1000 ? 'km' : 'm';
}

export function formatDistanceMeters(meters: number, mode: DistanceUnitMode = 'auto'): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0m';

  const unit = resolveDistanceUnit(meters, mode);
  if (unit === 'km') {
    const km = meters / 1000;
    return km >= 10 ? `${Math.round(km)}km` : `${(Math.round(km * 10) / 10).toFixed(1)}km`;
  }

  return `${Math.round(meters)}m`;
}

/** auto → m → km → auto */
export function cycleDistanceUnitMode(current: DistanceUnitMode): DistanceUnitMode {
  if (current === 'auto') return 'm';
  if (current === 'm') return 'km';
  return 'auto';
}
