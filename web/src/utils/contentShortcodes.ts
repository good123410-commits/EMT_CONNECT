export type ContentShortcodeSegment =
  | { type: 'text'; value: string }
  | { type: 'call_button'; phone: string; label?: string }
  | { type: 'ad_banner'; bannerId?: string }
  | { type: 'template'; body: string; title?: string };

const CONTENT_SHORTCODE_PATTERN =
  /\[(119_button|119_call|ad_banner)(?:\s+([^\]]*))?\]|\[(call|banner|template):([^\]]+)\]/gi;

const STRIP_SHORTCODE_PATTERN =
  /\[(119_button|119_call|ad_banner)(?:\s+[^\]]*)?\]|\[(call|banner|template):[^\]]+\]/gi;

function parseShortcodeAttrs(attrString?: string): Record<string, string> {
  if (!attrString?.trim()) return {};
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let match = attrRegex.exec(attrString);
  while (match) {
    attrs[match[1]] = match[2];
    match = attrRegex.exec(attrString);
  }
  return attrs;
}

function mapNamedShortcode(kind: string, attrs: Record<string, string>): ContentShortcodeSegment | null {
  switch (kind.toLowerCase()) {
    case '119_button':
    case '119_call':
      return {
        type: 'call_button',
        phone: attrs.phone?.trim() || '119',
        label: attrs.label?.trim() || undefined,
      };
    case 'ad_banner':
      return {
        type: 'ad_banner',
        bannerId: attrs.id?.trim() || undefined,
      };
    default:
      return null;
  }
}

function mapColonShortcode(kind: string, value: string): ContentShortcodeSegment | null {
  const trimmed = value.trim();
  if (kind.toLowerCase() === 'call') {
    return { type: 'call_button', phone: trimmed || '119' };
  }
  if (kind.toLowerCase() === 'banner') {
    return { type: 'ad_banner', bannerId: trimmed || undefined };
  }
  if (kind.toLowerCase() === 'template') {
    return null;
  }
  return null;
}

export function parseContentShortcodes(raw: string): ContentShortcodeSegment[] {
  const input = raw ?? '';
  if (!input.trim()) return [];

  const segments: ContentShortcodeSegment[] = [];
  let lastIndex = 0;
  const regex = new RegExp(CONTENT_SHORTCODE_PATTERN.source, 'gi');
  let match = regex.exec(input);

  while (match) {
    if (match.index > lastIndex) {
      const text = input.slice(lastIndex, match.index);
      if (text) segments.push({ type: 'text', value: text });
    }

    const namedKind = match[1];
    const colonKind = match[3];
    const segment = namedKind
      ? mapNamedShortcode(namedKind, parseShortcodeAttrs(match[2]))
      : colonKind
        ? mapColonShortcode(colonKind, match[4] ?? '')
        : null;

    if (segment) segments.push(segment);

    lastIndex = regex.lastIndex;
    match = regex.exec(input);
  }

  if (lastIndex < input.length) {
    segments.push({ type: 'text', value: input.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: input });
  }

  return segments;
}

export function stripContentShortcodes(raw: string): string {
  return raw.replace(STRIP_SHORTCODE_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}

export function hasContentShortcodes(raw: string): boolean {
  return new RegExp(STRIP_SHORTCODE_PATTERN.source, 'i').test(raw);
}
