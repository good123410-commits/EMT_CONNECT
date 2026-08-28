import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

type InsertListener<T extends Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<T>,
) => void;

function subscribeInsert<T extends Record<string, unknown>>(
  channelName: string,
  table: string,
  filter: string | undefined,
  onInsert: InsertListener<T>,
): () => void {
  let channel: RealtimeChannel | null = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload) => onInsert(payload as RealtimePostgresChangesPayload<T>),
    )
    .subscribe();

  return () => {
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
  };
}

export type EmsCommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  anonymous_label: string;
  content: string;
};

export type EmsPostReactionRow = {
  user_id: string;
  post_id: string;
  reaction: string;
};

export type EmsChatMessageRow = {
  id: string;
  post_type: string;
  room_id: string | null;
  author_id: string | null;
  anonymous_label: string;
  content: string;
};

export type LocalCommunityMessageRow = {
  id: string;
  room_id: string;
  author_id: string | null;
  anonymous_label: string;
  content: string;
};

export function subscribeEmsCommunityCommentInserts(
  onInsert: InsertListener<EmsCommentRow>,
): () => void {
  return subscribeInsert<EmsCommentRow>('push_ems_comments_insert', 'ems_community_comments', undefined, onInsert);
}

export function subscribeEmsPostReactionInserts(
  onInsert: InsertListener<EmsPostReactionRow>,
): () => void {
  return subscribeInsert<EmsPostReactionRow>(
    'push_ems_post_reactions_insert',
    'ems_community_post_reactions',
    undefined,
    onInsert,
  );
}

export function subscribeEmsChatMessageInserts(
  onInsert: InsertListener<EmsChatMessageRow>,
): () => void {
  return subscribeInsert<EmsChatMessageRow>(
    'push_ems_chat_messages_insert',
    'ems_community_posts',
    'post_type=eq.chat',
    onInsert,
  );
}

export function subscribeLocalCommunityMessageInserts(
  onInsert: InsertListener<LocalCommunityMessageRow>,
): () => void {
  return subscribeInsert<LocalCommunityMessageRow>(
    'push_local_community_messages_insert',
    'local_community_messages',
    undefined,
    onInsert,
  );
}
