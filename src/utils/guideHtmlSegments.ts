export type GuideHtmlSegment =
  | { type: 'image'; uri: string }
  | { type: 'html'; html: string };

const IMG_TAG_REGEX = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;

/** 본문 HTML을 이미지·텍스트 블록 순서대로 분리 (앱 네이티브 렌더링용) */
export function splitGuideHtmlSegments(html: string): GuideHtmlSegment[] {
  const segments: GuideHtmlSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  IMG_TAG_REGEX.lastIndex = 0;
  while ((match = IMG_TAG_REGEX.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    if (hasRenderableHtml(before)) {
      segments.push({ type: 'html', html: before });
    }
    segments.push({ type: 'image', uri: match[1] });
    lastIndex = match.index + match[0].length;
  }

  const tail = html.slice(lastIndex);
  if (hasRenderableHtml(tail)) {
    segments.push({ type: 'html', html: tail });
  }

  if (segments.length === 0 && html.trim()) {
    segments.push({ type: 'html', html });
  }

  return segments;
}

function hasRenderableHtml(chunk: string): boolean {
  const text = chunk
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 0 || /<blockquote\b/i.test(chunk);
}

export type InlineTextPart = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

/** 단순 인라인 태그(b/i/strong/em)만 파싱 */
export function parseInlineHtmlParts(html: string): InlineTextPart[] {
  const parts: InlineTextPart[] = [];
  const tagRegex = /<\/?([a-z]+)(?:\s[^>]*)?>/gi;
  let last = 0;
  let bold = false;
  let italic = false;
  let match: RegExpExecArray | null;

  const pushText = (raw: string) => {
    const text = decodeHtmlEntities(
      raw.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' '),
    );
    if (!text) return;
    parts.push({ text, bold, italic });
  };

  while ((match = tagRegex.exec(html)) !== null) {
    pushText(html.slice(last, match.index));
    const tag = match[1].toLowerCase();
    const closing = match[0].startsWith('</');
    if (tag === 'b' || tag === 'strong') bold = !closing;
    if (tag === 'i' || tag === 'em') italic = !closing;
    last = match.index + match[0].length;
  }

  pushText(html.slice(last));
  return parts;
}

export function splitHtmlBlocks(html: string): string[] {
  return html
    .split(/(?:<\/p>|<\/div>|<\/blockquote>)/gi)
    .map((block) =>
      block
        .replace(/^<(?:p|div|blockquote)\b[^>]*>/i, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .trim(),
    )
    .filter((block) => block.length > 0);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
