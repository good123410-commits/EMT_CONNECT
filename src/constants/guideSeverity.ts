export type GuideSeverity = 'critical' | 'urgent' | 'moderate';

export const GUIDE_SEVERITY_OPTIONS: { value: GuideSeverity; label: string }[] = [
  { value: 'critical', label: '긴급' },
  { value: 'urgent', label: '응급' },
  { value: 'moderate', label: '일반' },
];

export const GUIDE_SEVERITY_COLORS: Record<
  GuideSeverity,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: '#fef2f2', text: '#dc2626', label: '긴급' },
  urgent: { bg: '#fff7ed', text: '#ea580c', label: '응급' },
  moderate: { bg: '#f0fdf4', text: '#16a34a', label: '일반' },
};

const LEGACY_CRITICAL = new Set(['기도폐쇄', '심정지', '출혈']);
const LEGACY_URGENT = new Set(['골절', '저체온']);

export function normalizeGuideSeverity(
  severity: string | null | undefined,
  category?: string,
): GuideSeverity {
  if (severity === 'critical' || severity === 'urgent' || severity === 'moderate') {
    return severity;
  }
  if (category && LEGACY_CRITICAL.has(category)) return 'critical';
  if (category && LEGACY_URGENT.has(category)) return 'urgent';
  return 'moderate';
}
