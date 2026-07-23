import { extractGuideImageUrls, stripGuideHtml } from '@/services/kemiPostService';

export function stripCommunityHtml(html: string): string {
  return stripGuideHtml(html).replace(/\s+/g, ' ').trim();
}

export function extractCommunityImageUrls(html: string): string[] {
  return extractGuideImageUrls(html);
}

export function buildCommunityPreview(content: string, summary?: string | null, maxLen = 120): string {
  const source = summary?.trim() || content;
  const plain = stripCommunityHtml(source);
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}

export function getFirstCommunityImageUrl(content: string): string | null {
  const urls = extractCommunityImageUrls(content);
  return urls[0] ?? null;
}
