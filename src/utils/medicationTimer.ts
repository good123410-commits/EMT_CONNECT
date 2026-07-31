export const INTERVAL_PRESET_HOURS = [4, 6] as const;

export function clampIntervalHours(value: number): number {
  if (!Number.isFinite(value)) return 4;
  return Math.min(48, Math.max(1, Math.round(value)));
}

export function parseIntervalInput(input: string): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return clampIntervalHours(n);
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function computeNextDueAt(fromIso: string, intervalHours: number): string {
  const hours = clampIntervalHours(intervalHours);
  const base = new Date(fromIso).getTime();
  return new Date(base + hours * 60 * 60 * 1000).toISOString();
}

export function getRemainingMs(nextDueAt: string | null, nowMs = Date.now()): number | null {
  if (!nextDueAt) return null;
  return new Date(nextDueAt).getTime() - nowMs;
}

export function formatHistoryTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatIntervalLabel(hours: number): string {
  const h = clampIntervalHours(hours);
  return h === 1 ? '1시간' : `${h}시간`;
}
