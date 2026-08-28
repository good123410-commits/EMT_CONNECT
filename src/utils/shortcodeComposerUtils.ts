import {
  ADMIN_SHORTCODE_TRIGGER,
  type ShortcodePickerMode,
} from '@/types/shortcode';

const USER_TRIGGER_PATTERN = /(?:^|\s)[@＠]$/;

export type ShortcodeTriggerMatch = {
  mode: ShortcodePickerMode;
  range: { start: number; end: number };
};

function matchTriggerAtCursor(
  text: string,
  cursor: number,
  canUseAdminShortcodes: boolean,
): ShortcodeTriggerMatch | null {
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  const before = text.slice(0, safeCursor);

  if (canUseAdminShortcodes && before.endsWith(ADMIN_SHORTCODE_TRIGGER)) {
    return {
      mode: 'admin',
      range: {
        start: safeCursor - ADMIN_SHORTCODE_TRIGGER.length,
        end: safeCursor,
      },
    };
  }

  const userTriggerMatch = before.match(/[@＠]$/);
  if (userTriggerMatch && USER_TRIGGER_PATTERN.test(before)) {
    const triggerLength = userTriggerMatch[0].length;
    return {
      mode: 'user',
      range: { start: safeCursor - triggerLength, end: safeCursor },
    };
  }

  return null;
}

export function detectShortcodePickerTrigger(
  text: string,
  cursor: number,
  canUseAdminShortcodes: boolean,
): ShortcodeTriggerMatch | null {
  const positions = new Set<number>([
    Math.max(0, Math.min(cursor, text.length)),
    text.length,
  ]);

  for (const position of positions) {
    const match = matchTriggerAtCursor(text, position, canUseAdminShortcodes);
    if (match) return match;
  }

  return null;
}

export function estimateCursorAfterTextChange(
  previousText: string,
  nextText: string,
  previousSelection: { start: number; end: number },
): number {
  const diff = nextText.length - previousText.length;

  if (
    previousSelection.start === previousSelection.end &&
    previousSelection.start === previousText.length &&
    diff > 0
  ) {
    return nextText.length;
  }

  if (previousSelection.start === previousSelection.end) {
    return Math.max(0, Math.min(nextText.length, previousSelection.start + diff));
  }

  return Math.max(0, Math.min(nextText.length, previousSelection.start + diff));
}

export function insertShortcodeIntoText(
  text: string,
  shortcut: string,
  triggerRange: { start: number; end: number } | null,
): { text: string; selection: { start: number; end: number } } {
  const removeStart = triggerRange?.start ?? text.length;
  const removeEnd = triggerRange?.end ?? text.length;
  const before = text.slice(0, removeStart);
  const after = text.slice(removeEnd);
  const needsSpace = before.length > 0 && !/\s$/.test(before);
  const prefix = needsSpace ? ' ' : '';
  const nextText = `${before}${prefix}${shortcut}${after}`;
  const cursor = before.length + prefix.length + shortcut.length;

  return {
    text: nextText,
    selection: { start: cursor, end: cursor },
  };
}
