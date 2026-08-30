import { Fragment, useMemo } from 'react';
import { Text } from 'react-native';
import { ShortcodeAdBanner } from '@/components/content/ShortcodeAdBanner';
import { ShortcodeCallButton } from '@/components/content/ShortcodeCallButton';
import { ShortcodeTemplateBlock } from '@/components/content/ShortcodeTemplateBlock';
import { RichTextSegment, type RichTextTone } from '@/components/content/RichTextSegment';
import { useShortcodeRegistry } from '@/contexts/ShortcodeRegistryContext';
import { parseGuideContent } from '@/utils/guideContentFormat';
import { parseContentShortcodes } from '@/utils/contentShortcodes';

export type RichContentRendererProps = {
  content: string;
  /** 가이드 본문 — 스타일 메타 제거 + GuideRichTextBlock 사용 */
  variant?: 'default' | 'guide';
  tone?: RichTextTone;
  emptyMessage?: string;
  /** true면 텍스트 터치를 부모로 전달 (채팅 말풍선 롱프레스 등) */
  disableTextInteraction?: boolean;
};

export function RichContentRenderer({
  content,
  variant = 'default',
  tone = 'default',
  emptyMessage = '본문이 없습니다.',
  disableTextInteraction = false,
}: RichContentRendererProps) {
  const { shortcodes } = useShortcodeRegistry();
  const segments = useMemo(() => {
    const body = variant === 'guide' ? parseGuideContent(content).body : content;
    return parseContentShortcodes(body, shortcodes);
  }, [content, variant, shortcodes]);

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

        if (segment.type === 'template') {
          return (
            <ShortcodeTemplateBlock
              key={`template-${index}`}
              body={segment.body}
              title={segment.title}
            />
          );
        }

        return (
          <Fragment key={`text-${index}`}>
            <RichTextSegment
              value={segment.value}
              variant={variant}
              tone={tone}
              disableTextInteraction={disableTextInteraction}
            />
          </Fragment>
        );
      })}
    </>
  );
}
