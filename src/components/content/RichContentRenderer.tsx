import { Fragment, useMemo } from 'react';
import { Text } from 'react-native';
import { ShortcodeAdBanner } from '@/components/content/ShortcodeAdBanner';
import { ShortcodeCallButton } from '@/components/content/ShortcodeCallButton';
import { RichTextSegment, type RichTextTone } from '@/components/content/RichTextSegment';
import { parseGuideContent } from '@/utils/guideContentFormat';
import { parseContentShortcodes } from '@/utils/contentShortcodes';

export type RichContentRendererProps = {
  content: string;
  /** 가이드 본문 — 스타일 메타 제거 + GuideRichTextBlock 사용 */
  variant?: 'default' | 'guide';
  tone?: RichTextTone;
  emptyMessage?: string;
};

export function RichContentRenderer({
  content,
  variant = 'default',
  tone = 'default',
  emptyMessage = '본문이 없습니다.',
}: RichContentRendererProps) {
  const segments = useMemo(() => {
    const body = variant === 'guide' ? parseGuideContent(content).body : content;
    return parseContentShortcodes(body);
  }, [content, variant]);

  if (!content.trim()) {
    return <Text className="text-sm text-kemix-text-secondary">{emptyMessage}</Text>;
  }

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'call_button') {
          return (
            <ShortcodeCallButton
              key={`call-${index}`}
              phone={segment.phone}
              label={segment.label}
            />
          );
        }

        if (segment.type === 'ad_banner') {
          return <ShortcodeAdBanner key={`banner-${index}`} bannerId={segment.bannerId} />;
        }

        return (
          <Fragment key={`text-${index}`}>
            <RichTextSegment value={segment.value} variant={variant} tone={tone} />
          </Fragment>
        );
      })}
    </>
  );
}
