import type { ReactNode } from 'react';

const GUIDE_STYLE_META_REGEX = /^:::guide-style:([\s\S]*?):::\r?\n?/;

function stripGuideMetaPrefix(content: string): string {
  return content.replace(GUIDE_STYLE_META_REGEX, '');
}

export function getGuidePreviewText(content: string, summary?: string | null): string {
  if (summary?.trim()) return summary.trim();

  const trimmed = content.trim();
  if (!trimmed) return '응급처치 핵심 요약을 확인하세요.';

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    const plain = trimmed
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (plain.length <= 320) return plain;
    return `${plain.slice(0, 320).trim()}…`;
  }

  const firstBlock = trimmed.split(/\n\n+/).find((block) => block.trim())?.trim();
  if (!firstBlock) return trimmed.slice(0, 320);
  if (firstBlock.length <= 320) return firstBlock;
  return `${firstBlock.slice(0, 320).trim()}…`;
}

export function renderGuideContent(content: string): ReactNode {
  const trimmed = stripGuideMetaPrefix(content).trim();
  if (!trimmed) return <p className="muted">본문이 없습니다.</p>;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return <div className="guide-detail-body" dangerouslySetInnerHTML={{ __html: trimmed }} />;
  }
  return (
    <div className="guide-detail-body">
      {trimmed.split(/\n\n+/).map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </div>
  );
}

export function renderGuidePreview(content: string): ReactNode {
  const trimmed = content.trim();
  if (!trimmed) return <p className="muted">미리보기가 없습니다.</p>;
  return (
    <div className="guide-detail-preview-body">
      {trimmed.split(/\n\n+/).map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </div>
  );
}
