import type { KemixGuide } from '../services/guideService';
import { getGuideExcerpt } from '../services/guideService';

export function buildGuidePageUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/blog/${encodeURIComponent(slug)}`;
  }
  return `/blog/${encodeURIComponent(slug)}`;
}

export function buildGuideShareSummary(guide: KemixGuide): string {
  return getGuideExcerpt(guide) || '생활 응급처치 가이드를 KEMIX에서 확인하세요.';
}

export function buildGuideShareMessage(guide: KemixGuide): string {
  const summary = buildGuideShareSummary(guide);
  const pageUrl = buildGuidePageUrl(guide.slug);
  return `${guide.title}\n\n${summary}\n\n자세히 보기: ${pageUrl}`;
}

export function isShareAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.message.toLowerCase().includes('abort');
}

export async function copyGuideLink(guide: KemixGuide): Promise<void> {
  const url = buildGuidePageUrl(guide.slug);
  await navigator.clipboard.writeText(url);
}

export async function emailGuideShare(guide: KemixGuide): Promise<void> {
  const summary = buildGuideShareSummary(guide);
  const pageUrl = buildGuidePageUrl(guide.slug);
  const body = [
    guide.title,
    '',
    summary,
    '',
    `웹에서 보기: ${pageUrl}`,
    '',
    '※ 본 내용은 응급의료 정보 참고용이며, 의료 행위를 대체하지 않습니다.',
  ].join('\n');

  const mailto = `mailto:?subject=${encodeURIComponent(`[KEMIX] ${guide.title}`)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

export async function shareGuideWithNavigator(guide: KemixGuide): Promise<void> {
  if (!navigator.share) {
    await copyGuideLink(guide);
    return;
  }

  const pageUrl = buildGuidePageUrl(guide.slug);
  try {
    await navigator.share({
      title: guide.title,
      text: buildGuideShareSummary(guide),
      url: pageUrl,
    });
  } catch (error) {
    if (isShareAbortError(error)) return;
    throw error;
  }
}
