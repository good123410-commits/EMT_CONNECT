import { Linking, Platform, Share } from 'react-native';
import { KEMIX_WEB_URL } from '@/constants/env';
import type { KemiGuide } from '@/types/kemiGuide';
import { stripGuideHtml } from '@/services/kemiPostService';

export function buildGuideWebUrl(slug: string): string | null {
  const base = KEMIX_WEB_URL.trim().replace(/\/$/, '');
  if (!base) return null;
  return `${base}/blog/${encodeURIComponent(slug)}`;
}

export function buildGuideShareSummary(guide: KemiGuide): string {
  const fromMeta = guide.summary?.trim() || guide.seo_description?.trim();
  if (fromMeta) return fromMeta;
  const plain = stripGuideHtml(guide.content).replace(/\s+/g, ' ').trim();
  return plain.slice(0, 160) || '생활 응급처치 가이드를 KEMIX에서 확인하세요.';
}

export function buildGuideShareMessage(guide: KemiGuide): string {
  const summary = buildGuideShareSummary(guide);
  const pageUrl = buildGuideWebUrl(guide.slug);
  const lines = [guide.title, '', summary];
  if (pageUrl) {
    lines.push('', `자세히 보기: ${pageUrl}`);
  }
  return lines.join('\n');
}

/**
 * 카카오톡·메시지 등 OS 공유 시트로 가이드 링크 전달.
 */
export async function shareGuideOnKakao(guide: KemiGuide): Promise<void> {
  const message = buildGuideShareMessage(guide);
  const pageUrl = buildGuideWebUrl(guide.slug);

  const result = await Share.share(
    Platform.OS === 'ios'
      ? {
          message,
          url: pageUrl ?? undefined,
          title: guide.title,
        }
      : {
          message,
          title: guide.title,
        },
    {
      dialogTitle: '카카오톡으로 공유',
      subject: guide.title,
    },
  );

  if (result.action === Share.dismissedAction) {
    return;
  }
}

export async function emailGuideShare(guide: KemiGuide, recipient?: string | null): Promise<void> {
  const summary = buildGuideShareSummary(guide);
  const pageUrl = buildGuideWebUrl(guide.slug);
  const bodyLines = [
    guide.title,
    '',
    summary,
    '',
    pageUrl ? `웹에서 보기: ${pageUrl}` : 'KEMIX 앱에서 생활 응급처치 가이드를 확인해 주세요.',
    '',
    '※ 본 내용은 응급의료 정보 참고용이며, 의료 행위를 대체하지 않습니다.',
  ];

  const subject = encodeURIComponent(`[KEMIX] ${guide.title}`);
  const body = encodeURIComponent(bodyLines.join('\n'));
  const to = recipient?.trim() ? encodeURIComponent(recipient.trim()) : '';
  const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

  const can = await Linking.canOpenURL(mailto);
  if (!can) {
    throw new Error('이메일 앱을 열 수 없습니다.');
  }
  await Linking.openURL(mailto);
}
