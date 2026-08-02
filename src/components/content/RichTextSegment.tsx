import { Image, Platform, Text, TextStyle, View } from 'react-native';
import { GuideRichTextBlock } from '@/components/guides/GuideRichTextBlock';
import { EMS_LOUNGE } from '@/constants/emsLoungeTheme';
import { extractGuideImageUrls, stripGuideHtml } from '@/services/kemiPostService';
import { splitGuideHtmlSegments } from '@/utils/guideHtmlSegments';

export type RichTextTone = 'default' | 'lounge' | 'answer';

type RichTextSegmentProps = {
  value: string;
  variant?: 'default' | 'guide';
  tone?: RichTextTone;
};

function getTextClassName(tone: RichTextTone): string {
  switch (tone) {
    case 'lounge':
      return 'text-sm leading-[22px]';
    case 'answer':
      return 'text-sm leading-7 text-green-900';
    default:
      return 'text-sm leading-7 text-kemix-text';
  }
}

function getTextStyle(tone: RichTextTone): TextStyle | undefined {
  if (tone !== 'lounge') return undefined;
  return {
    fontFamily: 'Pretendard',
    fontSize: 14,
    lineHeight: 22,
    color: EMS_LOUNGE.textSecondary,
  };
}

export function RichTextSegment({ value, variant = 'default', tone = 'default' }: RichTextSegmentProps) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const textClassName = getTextClassName(tone);
  const textStyle = getTextStyle(tone);

  if (Platform.OS === 'web') {
    const isHtml = /<[a-z][\s\S]*>/i.test(trimmed);
    if (isHtml) {
      return (
        <div
          className={variant === 'guide' ? 'guide-detail-html' : 'content-detail-html'}
          dangerouslySetInnerHTML={{ __html: trimmed }}
          style={{ lineHeight: 1.75, color: tone === 'answer' ? '#14532d' : '#334155', fontSize: 15 }}
        />
      );
    }

    return (
      <div style={{ lineHeight: 1.75, color: tone === 'answer' ? '#14532d' : '#334155', fontSize: 15 }}>
        {trimmed.split(/\n\n+/).map((block, index) => (
          <p key={index} style={{ margin: '0 0 12px' }}>
            {block}
          </p>
        ))}
      </div>
    );
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(trimmed);

  if (variant === 'guide' && isHtml) {
    const segments = splitGuideHtmlSegments(trimmed);
    return (
      <View>
        {segments.map((segment, index) =>
          segment.type === 'image' ? (
            <Image
              key={`img-${segment.uri}-${index}`}
              source={{ uri: segment.uri }}
              style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 12 }}
              resizeMode="contain"
            />
          ) : (
            <GuideRichTextBlock key={`html-${index}`} html={segment.html} />
          ),
        )}
      </View>
    );
  }

  const images = extractGuideImageUrls(trimmed);
  const text = isHtml ? stripGuideHtml(trimmed) : trimmed;

  return (
    <View>
      {images.map((uri) => (
        <Image
          key={uri}
          source={{ uri }}
          style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 12 }}
          resizeMode="cover"
        />
      ))}
      {text.trim() ? (
        <Text className={textClassName} style={textStyle} selectable>
          {text}
        </Text>
      ) : null}
    </View>
  );
}
