import {
  DEFAULT_GUIDE_FONT_ID,
  DEFAULT_GUIDE_FONT_SIZE,
  normalizeGuideFontSize,
  type GuideFontSize,
} from '@/constants/guideFonts';

const GUIDE_STYLE_META_REGEX = /^:::guide-style:([\s\S]*?):::\r?\n?/;

export type GuideContentMeta = {
  fontId: string;
  fontSize: GuideFontSize;
};

export function serializeGuideContent(body: string, meta: GuideContentMeta): string {
  const payload = JSON.stringify({
    fontId: meta.fontId,
    fontSize: meta.fontSize,
  });
  return `:::guide-style:${payload}:::\n${body}`;
}

export function parseGuideContent(stored: string): {
  body: string;
  meta: GuideContentMeta | null;
} {
  const trimmed = stored.trim();
  const match = trimmed.match(GUIDE_STYLE_META_REGEX);
  if (!match) {
    return { body: stored, meta: null };
  }

  try {
    const parsed = JSON.parse(match[1]) as Partial<GuideContentMeta>;
    const meta: GuideContentMeta = {
      fontId: parsed.fontId?.trim() || DEFAULT_GUIDE_FONT_ID,
      fontSize: normalizeGuideFontSize(parsed.fontSize ?? DEFAULT_GUIDE_FONT_SIZE),
    };
    return {
      body: trimmed.slice(match[0].length),
      meta,
    };
  } catch {
    return { body: stored, meta: null };
  }
}

export function stripGuideContentMeta(stored: string): string {
  return parseGuideContent(stored).body;
}
