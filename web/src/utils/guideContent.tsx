import type { ReactNode } from 'react';
import { RichContentRenderer } from '../components/RichContentRenderer';
import { stripContentShortcodes } from './contentShortcodes';

const GUIDE_STYLE_META_REGEX = /^:::guide-style:([\s\S]*?):::\r?\n?/;

function stripGuideMetaPrefix(content: string): string {
  return content.replace(GUIDE_STYLE_META_REGEX, '');
}

export function getGuidePreviewText(content: string, summary?: string | null): string {
  if (summary?.trim()) return summary.trim();

  const trimmed = content.trim();
  if (!trimmed) return '응급처치 핵심 요약을 확인하세요.';

  const body = stripGuideMetaPrefix(trimmed);

  if (/<[a-z][\s\S]*>/i.test(body)) {
    const plain = stripContentShortcodes(
      body
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    );
    if (plain.length <= 320) return plain;
    return `${plain.slice(0, 320).trim()}…`;
  }

  const plain = stripContentShortcodes(body);
  const firstBlock = plain.split(/\n\n+/).find((block) => block.trim())?.trim();
  if (!firstBlock) return plain.slice(0, 320);
  if (firstBlock.length <= 320) return firstBlock;
  return `${firstBlock.slice(0, 320).trim()}…`;
}

export function renderGuideContent(content: string): ReactNode {
  return <RichContentRenderer content={content} variant="guide" />;
}

export function renderGuidePreview(content: string): ReactNode {
  const trimmed = stripContentShortcodes(stripGuideMetaPrefix(content)).trim();
  if (!trimmed) return <p className="muted">미리보기가 없습니다.</p>;
  return (
    <div className="guide-detail-preview-body">
      {trimmed.split(/\n\n+/).map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </div>
  );
}
