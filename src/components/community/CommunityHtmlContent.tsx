import { Platform, Image, Text, View } from 'react-native';
import { extractGuideImageUrls, stripGuideHtml } from '@/services/kemiPostService';

type CommunityHtmlContentProps = {
  content: string;
};

export function CommunityHtmlContent({ content }: CommunityHtmlContentProps) {
  const trimmed = content.trim();

  if (!trimmed) {
    return <Text className="text-sm text-slate-500">본문이 없습니다.</Text>;
  }

  if (Platform.OS === 'web') {
    return (
      <div
        className="guide-detail-html"
        dangerouslySetInnerHTML={{ __html: trimmed }}
        style={{ lineHeight: 1.75, color: '#334155', fontSize: 15 }}
      />
    );
  }

  const images = extractGuideImageUrls(trimmed);
  const isHtml = /<[a-z][\s\S]*>/i.test(trimmed);
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
      <Text className="text-sm leading-7 text-slate-800" selectable>
        {text}
      </Text>
    </View>
  );
}
