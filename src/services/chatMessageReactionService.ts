import { supabase } from '@/lib/supabaseClient';
import type {
  ChatMessageContext,
  ChatMessageReactionSummary,
  ChatMessageReactionType,
  ChatReactionCounts,
} from '@/types/chatReactions';
import {
  normalizeChatReactionKey,
  parseChatReactionCounts,
} from '@/types/chatReactions';

export class ChatMessageReactionServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatMessageReactionServiceError';
  }
}

function isMissingRpcError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('could not find the function') ||
    normalized.includes('pgrst202') ||
    normalized.includes('schema cache')
  );
}

function mapSummaryRow(row: {
  message_id?: string;
  counts?: unknown;
  my_reaction?: unknown;
}): ChatMessageReactionSummary | null {
  const messageId = typeof row.message_id === 'string' ? row.message_id : '';
  if (!messageId) return null;

  const myReaction = normalizeChatReactionKey(row.my_reaction);
  return {
    messageId,
    counts: parseChatReactionCounts(row.counts),
    myReaction,
  };
}

export async function fetchRoomChatReactionSummaries(
  messageContext: ChatMessageContext,
  roomId: string,
): Promise<Record<string, ChatMessageReactionSummary>> {
  const { data, error } = await supabase.rpc('list_room_chat_reaction_summaries', {
    p_message_context: messageContext,
    p_room_id: roomId,
  });

  if (error) {
    if (isMissingRpcError(error.message)) {
      return {};
    }
    throw new ChatMessageReactionServiceError(error.message);
  }

  const rows = Array.isArray(data) ? data : [];
  const map: Record<string, ChatMessageReactionSummary> = {};

  for (const entry of rows) {
    const summary = mapSummaryRow(entry as { message_id?: string; counts?: unknown; my_reaction?: unknown });
    if (summary) {
      map[summary.messageId] = summary;
    }
  }

  return map;
}

export async function toggleChatMessageReaction(input: {
  messageContext: ChatMessageContext;
  messageId: string;
  reaction: ChatMessageReactionType;
}): Promise<ChatMessageReactionSummary> {
  const { data, error } = await supabase.rpc('toggle_chat_message_reaction', {
    p_message_context: input.messageContext,
    p_message_id: input.messageId,
    p_reaction: input.reaction,
  });

  if (error) {
    if (error.message.includes('not_authenticated')) {
      throw new ChatMessageReactionServiceError('로그인 후 반응을 남길 수 있습니다.');
    }
    throw new ChatMessageReactionServiceError(error.message);
  }

  const payload = (data ?? {}) as {
    message_id?: string;
    counts?: ChatReactionCounts;
    my_reaction?: unknown;
  };

  const messageId = payload.message_id ?? input.messageId;
  return {
    messageId,
    counts: parseChatReactionCounts(payload.counts),
    myReaction: normalizeChatReactionKey(payload.my_reaction),
  };
}
