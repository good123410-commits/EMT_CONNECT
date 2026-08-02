import { Fragment } from 'react';
import { useMemo } from 'react';
import { ShortcodeAdBanner } from './ShortcodeAdBanner';
import { ShortcodeCallButton } from './ShortcodeCallButton';
import { parseContentShortcodes } from '../utils/contentShortcodes';

const GUIDE_STYLE_META_REGEX = /^:::guide-style:([\s\S]*?):::\r?\n?/;

function stripGuideMetaPrefix(content: string): string {
  return content.replace(GUIDE_STYLE_META_REGEX, '');
}

type RichTextSegmentProps = {
  value: string;
  variant?: 'default' | 'guide';
};

function RichTextSegment({ value, variant = 'default' }: RichTextSegmentProps) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const className = variant === 'guide' ? 'guide-detail-body' : 'community-post-detail-body';

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: trimmed }} />;
  }

  return (
    <div className={className}>
      {trimmed.split(/\n\n+/).map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </div>
  );
}

export type RichContentRendererProps = {
  content: string;
  variant?: 'default' | 'guide';
  emptyMessage?: string;
};

export function RichContentRenderer({
  content,
  variant = 'default',
  emptyMessage = '본문이 없습니다.',
}: RichContentRendererProps) {
  const segments = useMemo(() => {
    const body = variant === 'guide' ? stripGuideMetaPrefix(content) : content;
    return parseContentShortcodes(body);
  }, [content, variant]);

  if (!content.trim()) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <div className="rich-content">
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
            <RichTextSegment value={segment.value} variant={variant} />
          </Fragment>
        );
      })}
    </div>
  );
}
