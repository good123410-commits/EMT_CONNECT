import { RichContentRenderer } from './RichContentRenderer';

type CommunityRichContentProps = {
  content: string;
};

/** @deprecated `RichContentRenderer` 사용 */
export function CommunityRichContent({ content }: CommunityRichContentProps) {
  return <RichContentRenderer content={content} />;
}
