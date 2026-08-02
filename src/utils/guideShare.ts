import * as Clipboard from 'expo-clipboard';
import { InteractionManager, Linking, Platform, Share } from 'react-native';
import { KEMIX_WEB_URL } from '@/constants/env';
import type { KemiGuide } from '@/types/kemiGuide';
import { stripGuideHtml } from '@/services/kemiPostService';
import { stripContentShortcodes } from '@/utils/contentShortcodes';

export type GuideShareResult = 'shared' | 'dismissed' | 'copied' | 'opened';

export function buildGuideWebUrl(slug: string): string | null {
  const base = KEMIX_WEB_URL.trim().replace(/\/$/, '');
  if (!base) return null;
  return `${base}/blog/${encodeURIComponent(slug)}`;
}

export function buildGuideShareSummary(guide: KemiGuide): string {
  const fromMeta = guide.summary?.trim() || guide.seo_description?.trim();
  if (fromMeta) return fromMeta;
  const plain = stripContentShortcodes(stripGuideHtml(guide.content)).replace(/\s+/g, ' ').trim();
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

/** Modal 닫힘 애니메이션 이후 네이티브 공유/링크 열기 (겹침으로 시트가 바로 닫히는 현상 방지) */
export function runAfterShareModalClose(action: () => Promise<void>): void {
  const delayMs = Platform.OS === 'ios' ? 420 : Platform.OS === 'web' ? 300 : 320;
  setTimeout(() => {
    if (Platform.OS === 'web') {
      void action();
      return;
    }
    InteractionManager.runAfterInteractions(() => {
      void action();
    });
  }, delayMs);
}

function isShareAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.message.toLowerCase().includes('abort');
}

/**
 * OS 시스템 공유 시트 (카카오톡·메시지·메일·복사 등).
 * Modal 위에서 호출하지 말고 `runAfterShareModalClose`와 함께 사용.
 */
export async function shareGuideWithSystemSheet(guide: KemiGuide): Promise<GuideShareResult> {
  const summary = buildGuideShareSummary(guide);
  const pageUrl = buildGuideWebUrl(guide.slug);
  const title = guide.title;

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text: summary,
        url: pageUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined),
      });
      return 'shared';
    } catch (error) {
      if (isShareAbortError(error)) return 'dismissed';
      throw error;
    }
  }

  const message =
    Platform.OS === 'ios' && pageUrl
      ? `${title}\n\n${summary}`
      : buildGuideShareMessage(guide);

  const result = await Share.share(
    Platform.OS === 'ios'
      ? {
          message,
          url: pageUrl ?? undefined,
          title,
        }
      : {
          message,
          title,
        },
    {
      dialogTitle: '공유하기',
      subject: title,
    },
  );

  return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
}

export async function copyGuideLink(guide: KemiGuide): Promise<GuideShareResult> {
  const pageUrl = buildGuideWebUrl(guide.slug);
  const text = pageUrl ?? buildGuideShareMessage(guide);
  await Clipboard.setStringAsync(text);
  return 'copied';
}

export async function emailGuideShare(
  guide: KemiGuide,
  recipient?: string | null,
): Promise<GuideShareResult> {
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
  return 'opened';
}

/** @deprecated shareGuideWithSystemSheet 사용 */
export async function shareGuideOnKakao(guide: KemiGuide): Promise<void> {
  await shareGuideWithSystemSheet(guide);
}
