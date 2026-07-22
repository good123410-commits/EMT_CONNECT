/** HTML 본문에서 첫 번째 이미지 URL 추출 */
export function extractFirstImageUrl(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}
