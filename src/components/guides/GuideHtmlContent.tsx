import { Platform, Image, Text, View } from 'react-native';
import { GuideRichTextBlock } from '@/components/guides/GuideRichTextBlock';
import { parseGuideContent } from '@/utils/guideContentFormat';
import { splitGuideHtmlSegments } from '@/utils/guideHtmlSegments';

type GuideHtmlContentProps = {
  content: string;
};

export function GuideHtmlContent({ content }: GuideHtmlContentProps) {
  const { body } = parseGuideContent(content);
  const trimmed = body.trim();

  if (!trimmed) {
    return <Text className="text-sm text-slate-500">본문이 없습니다.</Text>;
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(trimmed);

  if (Platform.OS === 'web') {
    return (
      <div
        className="guide-detail-html"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  if (!isHtml) {
    return (
      <Text className="text-sm leading-7 text-slate-800" selectable>
        {trimmed.split(/\n\n+/).join('\n\n')}
      </Text>
    );
  }

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
