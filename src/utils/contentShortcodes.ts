import type { ContentShortcode } from '@/types/shortcode';

export type ContentShortcodeSegment =
  | { type: 'text'; value: string }
  | { type: 'call_button'; phone: string; label?: string }
  | { type: 'ad_banner'; bannerId?: string }
  | { type: 'template'; body: string; title?: string };

/** `[call:119]`, `[119_button]`, `[ad_banner]`, `[banner:id]` 등 */
const CONTENT_SHORTCODE_PATTERN =
  /\[(119_button|119_call|ad_banner)(?:\s+([^\]]*))?\]|\[(call|banner|template):([^\]]+)\]/gi;

const STRIP_SHORTCODE_PATTERN =
  /\[(119_button|119_call|ad_banner)(?:\s+[^\]]*)?\]|\[(call|banner|template):[^\]]+\]/gi;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

function segmentFromDefinition(def: ContentShortcode): ContentShortcodeSegment | null {
  switch (def.action_type) {
    case 'call_button': {
      const payload = def.action_payload as { phone?: string; label?: string };
      return {
        type: 'call_button',
        phone: payload.phone?.trim() || '119',
        label: payload.label?.trim() || def.title,
      };
    }
    case 'ad_banner': {
      const payload = def.action_payload as { bannerId?: string };
      return {
        type: 'ad_banner',
        bannerId: payload.bannerId?.trim() || undefined,
      };
    }
    case 'template': {
      const payload = def.action_payload as { body?: string };
      const body = payload.body?.trim();
      if (!body) return null;
      return {
        type: 'template',
        body,
        title: def.title,
      };
    }
    default:
      return null;
  }
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
    return {
      type: 'call_button',
      phone: trimmed || '119',
    };
  }
  if (kind.toLowerCase() === 'banner') {
    return {
      type: 'ad_banner',
      bannerId: trimmed || undefined,
    };
  }
  if (kind.toLowerCase() === 'template') {
    return null;
  }
  return null;
}

function buildRegistryLookup(registry?: ContentShortcode[]): Map<string, ContentShortcode> {
  const lookup = new Map<string, ContentShortcode>();
  if (!registry?.length) return lookup;
  for (const row of registry) {
    if (!row.is_active) continue;
    lookup.set(row.shortcut, row);
  }
  return lookup;
}

function buildCombinedPattern(registry?: ContentShortcode[]): RegExp {
  const registryShortcuts = (registry ?? [])
    .filter((row) => row.is_active && row.shortcut.trim())
    .sort((a, b) => b.shortcut.length - a.shortcut.length)
    .map((row) => escapeRegex(row.shortcut));

  const parts = [...registryShortcuts, CONTENT_SHORTCODE_PATTERN.source];
  return new RegExp(`(${parts.join('|')})`, 'gi');
}

function parseLegacyShortcodeToken(token: string): ContentShortcodeSegment | null {
  const regex = new RegExp(`^${CONTENT_SHORTCODE_PATTERN.source}$`, 'i');
  const match = regex.exec(token);
  if (!match) return null;

  const namedKind = match[1];
  const colonKind = match[3];
  if (namedKind) {
    return mapNamedShortcode(namedKind, parseShortcodeAttrs(match[2]));
  }
  if (colonKind) {
    return mapColonShortcode(colonKind, match[4] ?? '');
  }
  return null;
}

export function parseContentShortcodes(
  raw: string,
  registry?: ContentShortcode[],
): ContentShortcodeSegment[] {
  const input = raw ?? '';
  if (!input.trim()) return [];

  const lookup = buildRegistryLookup(registry);
  const regex = buildCombinedPattern(registry);
  const segments: ContentShortcodeSegment[] = [];
  let lastIndex = 0;
  let match = regex.exec(input);

  while (match) {
    if (match.index > lastIndex) {
      const text = input.slice(lastIndex, match.index);
      if (text) segments.push({ type: 'text', value: text });
    }

    const matchedText = match[0];
    const registryDef = lookup.get(matchedText);
    const segment = registryDef
      ? segmentFromDefinition(registryDef)
      : parseLegacyShortcodeToken(matchedText);

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

export function stripContentShortcodes(raw: string, registry?: ContentShortcode[]): string {
  const lookup = buildRegistryLookup(registry);
  let next = raw;
  for (const shortcut of lookup.keys()) {
    next = next.split(shortcut).join(' ');
  }
  return next.replace(STRIP_SHORTCODE_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}

export function hasContentShortcodes(raw: string, registry?: ContentShortcode[]): boolean {
  const lookup = buildRegistryLookup(registry);
  for (const shortcut of lookup.keys()) {
    if (raw.includes(shortcut)) return true;
  }
  return new RegExp(STRIP_SHORTCODE_PATTERN.source, 'i').test(raw);
}
