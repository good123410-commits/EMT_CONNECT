import { Text, View } from 'react-native';
import { parseInlineHtmlParts, splitHtmlBlocks } from '@/utils/guideHtmlSegments';

type GuideRichTextBlockProps = {
  html: string;
};

export function GuideRichTextBlock({ html }: GuideRichTextBlockProps) {
  const blocks = splitHtmlBlocks(html);

  if (blocks.length === 0) {
    const parts = parseInlineHtmlParts(html);
    if (parts.length === 0) return null;
    return (
      <Text className="mb-3 text-sm leading-7 text-slate-800" selectable>
        {parts.map((part, index) => (
          <Text
            key={index}
            className={[
              part.bold ? 'font-bold' : '',
              part.italic ? 'italic' : '',
              'text-slate-800',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  }

  return (
    <View className="mb-1">
      {blocks.map((block, index) => {
        const isQuote = /^<blockquote\b/i.test(block);
        const cleaned = block.replace(/^<blockquote\b[^>]*>/i, '').trim();
        const parts = parseInlineHtmlParts(cleaned);

        if (isQuote) {
          return (
            <View
              key={index}
              className="mb-3 border-l-4 border-emerald-600 bg-slate-50 px-3 py-2"
            >
              <Text className="text-sm leading-7 text-slate-600" selectable>
                {parts.map((part, partIndex) => (
                  <Text
                    key={partIndex}
                    className={[
                      part.bold ? 'font-bold' : '',
                      part.italic ? 'italic' : '',
                      'text-slate-600',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {part.text}
                  </Text>
                ))}
              </Text>
            </View>
          );
        }

        return (
          <Text key={index} className="mb-3 text-sm leading-7 text-slate-800" selectable>
            {parts.map((part, partIndex) => (
              <Text
                key={partIndex}
                className={[
                  part.bold ? 'font-bold' : '',
                  part.italic ? 'italic' : '',
                  'text-slate-800',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {part.text}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}
