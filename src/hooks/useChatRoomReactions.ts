import { useCallback, useEffect, useState } from 'react';
import { subscribeChatMessageReactions } from '@/lib/realtimeSubscription';
import {
  fetchRoomChatReactionSummaries,
  toggleChatMessageReaction,
} from '@/services/chatMessageReactionService';
import type {
  ChatMessageContext,
  ChatMessageReactionSummary,
  ChatMessageReactionType,
} from '@/types/chatReactions';

export function useChatRoomReactions(messageContext: ChatMessageContext, roomId: string) {
  const [reactionsByMessageId, setReactionsByMessageId] = useState<
    Record<string, ChatMessageReactionSummary>
  >({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const map = await fetchRoomChatReactionSummaries(messageContext, roomId);
      setReactionsByMessageId(map);
    } catch {
      setReactionsByMessageId({});
    } finally {
      setLoading(false);
    }
  }, [messageContext, roomId]);

  useEffect(() => {
    setLoading(true);
    void reload();
    const unsubscribe = subscribeChatMessageReactions(() => {
      void reload();
    });
    return unsubscribe;
  }, [reload]);

  const toggleReaction = useCallback(
    async (messageId: string, reaction: ChatMessageReactionType) => {
      const summary = await toggleChatMessageReaction({
        messageContext,
        messageId,
        reaction,
      });
      setReactionsByMessageId((prev) => ({
        ...prev,
        [messageId]: summary,
      }));
      return summary;
    },
    [messageContext],
  );

  return {
    reactionsByMessageId,
    loading,
    reload,
    toggleReaction,
  };
}
