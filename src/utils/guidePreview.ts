import { stripGuideHtml } from '@/services/kemiPostService';

export function getGuidePreviewText(content: string, summary?: string | null): string {
  if (summary?.trim()) return summary.trim();

  const trimmed = content.trim();
  if (!trimmed) return '응급처치 핵심 요약을 확인하세요.';

  const plain = /<[a-z][\s\S]*>/i.test(trimmed) ? stripGuideHtml(trimmed) : trimmed;
  const normalized = plain.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 320) return normalized;
  return `${normalized.slice(0, 320).trim()}…`;
}
