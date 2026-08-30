export const CHAT_REACTION_QUICK_OPTIONS = [
  { key: 'heart', emoji: '❤️', label: '하트' },
  { key: 'thumbs_up', emoji: '👍', label: '좋아요' },
  { key: 'blue_heart', emoji: '💙', label: '파란하트' },
  { key: 'laugh', emoji: '😄', label: '웃음' },
  { key: 'wow', emoji: '😲', label: '놀람' },
  { key: 'pleading', emoji: '🥺', label: '부탁' },
] as const;

export const CHAT_REACTION_MORE_OPTIONS = [
  { key: 'confirm', emoji: '✅', label: '확인' },
  { key: 'helpful', emoji: '💡', label: '도움' },
  { key: 'dislike', emoji: '👎', label: '싫어요' },
] as const;

export const CHAT_REACTION_OPTIONS = [
  ...CHAT_REACTION_QUICK_OPTIONS,
  ...CHAT_REACTION_MORE_OPTIONS,
] as const;

export type ChatMessageReactionType = (typeof CHAT_REACTION_OPTIONS)[number]['key'];

export type ChatMessageContext = 'local_community' | 'ems_chat';

export type ChatReactionCounts = Partial<Record<ChatMessageReactionType, number>>;

export type ChatMessageReactionSummary = {
  messageId: string;
  counts: ChatReactionCounts;
  myReaction: ChatMessageReactionType | null;
};

export type ChatContextMenuMessage = {
  id: string;
  content: string;
  anonymousLabel: string;
  authorId?: string | null;
};

const LEGACY_REACTION_KEY_MAP: Record<string, ChatMessageReactionType> = {
  like: 'thumbs_up',
};

export function normalizeChatReactionKey(value: unknown): ChatMessageReactionType | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (LEGACY_REACTION_KEY_MAP[trimmed]) {
    return LEGACY_REACTION_KEY_MAP[trimmed];
  }
  return isChatMessageReactionType(trimmed) ? trimmed : null;
}

export function emptyChatReactionCounts(): ChatReactionCounts {
  return {};
}

export function parseChatReactionCounts(raw: unknown): ChatReactionCounts {
  if (!raw || typeof raw !== 'object') return {};
  const counts: ChatReactionCounts = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalizedKey = normalizeChatReactionKey(key);
    if (!normalizedKey) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue;
    counts[normalizedKey] = (counts[normalizedKey] ?? 0) + value;
  }
  return counts;
}

export function isChatMessageReactionType(value: unknown): value is ChatMessageReactionType {
  return CHAT_REACTION_OPTIONS.some((option) => option.key === value);
}

export function getChatReactionEmoji(reaction: ChatMessageReactionType): string {
  const option = CHAT_REACTION_OPTIONS.find((entry) => entry.key === reaction);
  return option?.emoji ?? '👍';
}

export function getChatReactionLabel(reaction: ChatMessageReactionType): string {
  const option = CHAT_REACTION_OPTIONS.find((entry) => entry.key === reaction);
  return option?.label ?? reaction;
}
