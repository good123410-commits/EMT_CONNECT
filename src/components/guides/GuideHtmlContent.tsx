import { RichContentRenderer } from '@/components/content/RichContentRenderer';

type GuideHtmlContentProps = {
  content: string;
};

export function GuideHtmlContent({ content }: GuideHtmlContentProps) {
  return <RichContentRenderer content={content} variant="guide" />;
}
