import { Text, View } from 'react-native';
import { APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import { RichTextSegment } from '@/components/content/RichTextSegment';

type ShortcodeTemplateBlockProps = {
  body: string;
  title?: string;
};

export function ShortcodeTemplateBlock({ body, title }: ShortcodeTemplateBlockProps) {
  const { colors } = useThemedColors();

  return (
    <View
      className="my-3 overflow-hidden rounded-2xl border px-4 py-3"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderRadius: APP_RADIUS.card,
      }}
    >
      {title?.trim() ? (
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-kemix-muted">{title}</Text>
      ) : null}
      <RichTextSegment value={body} tone="community" />
    </View>
  );
}
