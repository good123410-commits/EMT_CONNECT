import { RichContentRenderer } from '@/components/content/RichContentRenderer';

type CommunityHtmlContentProps = {
  content: string;
};

/** 게시글·댓글 본문 — HTML/텍스트 + 숏코드 */
export function CommunityHtmlContent({ content }: CommunityHtmlContentProps) {
  return <RichContentRenderer content={content} />;
}
