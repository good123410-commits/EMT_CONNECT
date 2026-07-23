export function stripCommunityHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCommunityPreview(content: string, summary?: string | null, maxLen = 80): string {
  const source = summary?.trim() || content;
  const plain = stripCommunityHtml(source);
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}

export function extractCommunityImageUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match = regex.exec(html);
  while (match) {
    if (match[1]) urls.push(match[1]);
    match = regex.exec(html);
  }
  return urls;
}

export function getFirstCommunityImageUrl(content: string): string | null {
  return extractCommunityImageUrls(content)[0] ?? null;
}
