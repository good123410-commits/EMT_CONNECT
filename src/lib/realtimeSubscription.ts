import type {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
} from '@supabase/supabase-js';
import { QUESTIONS_TABLE, USER_PROFILES_TABLE, supabase } from '@/lib/supabaseClient';

type ChangeListener = () => void;

type PostgresChangeBinding = RealtimePostgresChangesFilter<'*' | 'INSERT' | 'UPDATE' | 'DELETE'>;

type SubscriptionRegistry = {
  listeners: Set<ChangeListener>;
  channel: RealtimeChannel | null;
  bindings: PostgresChangeBinding[];
};

const registries = new Map<string, SubscriptionRegistry>();

function notifyRegistry(registry: SubscriptionRegistry) {
  for (const listener of registry.listeners) {
    listener();
  }
}

function ensureRegistryChannel(channelKey: string, registry: SubscriptionRegistry) {
  if (registry.channel) return;

  let builder = supabase.channel(channelKey);
  for (const binding of registry.bindings) {
    builder = builder.on('postgres_changes', binding, () => notifyRegistry(registry));
  }
  registry.channel = builder.subscribe();
}

function teardownRegistry(channelKey: string, registry: SubscriptionRegistry) {
  if (registry.channel) {
    void supabase.removeChannel(registry.channel);
    registry.channel = null;
  }
  registries.delete(channelKey);
}

function createPostgresChangeSubscription(
  channelKey: string,
  bindings: PostgresChangeBinding[],
) {
  return (onChange: ChangeListener): (() => void) => {
    let registry = registries.get(channelKey);
    if (!registry) {
      registry = { listeners: new Set(), channel: null, bindings };
      registries.set(channelKey, registry);
    }

    registry.listeners.add(onChange);
    ensureRegistryChannel(channelKey, registry);

    return () => {
      const current = registries.get(channelKey);
      if (!current) return;

      current.listeners.delete(onChange);
      if (current.listeners.size === 0) {
        teardownRegistry(channelKey, current);
      }
    };
  };
}

function createTableSubscription(table: string, channelName: string) {
  return createPostgresChangeSubscription(channelName, [
    { event: '*', schema: 'public', table },
  ]);
}

export const subscribeEmergencyGuidesTable = createTableSubscription(
  'emergency_guides',
  'emergency_guides_live',
);

export const subscribeGuideCategoriesTable = createTableSubscription(
  'guide_categories',
  'guide_categories_live',
);

export const subscribeEmsCommunityPostsTable = createTableSubscription(
  'ems_community_posts',
  'ems_community_posts_live',
);

export function subscribeEmsPostComments(postId: string, onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription(`ems_community_comments_${postId}`, [
    {
      event: '*',
      schema: 'public',
      table: 'ems_community_comments',
      filter: `post_id=eq.${postId}`,
    },
  ]);
  return subscribe(onChange);
}

export const subscribeEmsChatRoomsTable = createTableSubscription(
  'ems_chat_rooms',
  'ems_chat_rooms_live',
);

export const subscribeKemiPostsTable = createTableSubscription(
  'kemi_posts',
  'kemi_posts_live',
);

export const subscribeKemiPostCategoriesTable = createTableSubscription(
  'kemix_post_categories',
  'kemix_post_categories_live',
);

export function subscribeKemiPostComments(postId: string, onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription(`kemi_post_comments_${postId}`, [
    {
      event: '*',
      schema: 'public',
      table: 'kemi_post_comments',
      filter: `post_id=eq.${postId}`,
    },
  ]);
  return subscribe(onChange);
}

export function subscribeKemiPostEngagement(postId: string, onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription(`kemi_post_engagement_${postId}`, [
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'kemi_posts',
      filter: `id=eq.${postId}`,
    },
    {
      event: '*',
      schema: 'public',
      table: 'kemi_post_likes',
      filter: `post_id=eq.${postId}`,
    },
  ]);
  return subscribe(onChange);
}

export function subscribeHomeEventBanners(onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription('kemix_home_event_banners_live', [
    {
      event: '*',
      schema: 'public',
      table: 'kemix_home_event_banners',
    },
  ]);
  return subscribe(onChange);
}

export function subscribeHomeEmergencyNotices(onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription('kemix_home_emergency_notices_live', [
    {
      event: '*',
      schema: 'public',
      table: 'kemix_home_emergency_notices',
    },
    {
      event: '*',
      schema: 'public',
      table: 'kemix_disaster_ticker_cache',
    },
    {
      event: '*',
      schema: 'public',
      table: 'kemix_emergency_ticker_item_settings',
    },
  ]);
  return subscribe(onChange);
}

export function subscribeChatMessageReactions(onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription('kemix_chat_message_reactions_live', [
    {
      event: '*',
      schema: 'public',
      table: 'kemix_chat_message_reactions',
    },
  ]);
  return subscribe(onChange);
}

export function subscribeLocalCommunityPosts(
  regionCode: string,
  onChange: ChangeListener,
): () => void {
  const subscribe = createPostgresChangeSubscription(`local_community_posts_${regionCode}`, [
    {
      event: '*',
      schema: 'public',
      table: 'local_community_posts',
      filter: `region_code=eq.${regionCode}`,
    },
  ]);
  return subscribe(onChange);
}

export function subscribeLocalCommunityRooms(
  regionCode: string,
  onChange: ChangeListener,
): () => void {
  const subscribe = createPostgresChangeSubscription(`local_community_rooms_${regionCode}`, [
    {
      event: '*',
      schema: 'public',
      table: 'local_community_rooms',
      filter: `region_code=eq.${regionCode}`,
    },
  ]);
  return subscribe(onChange);
}

export function subscribeLocalCommunityMessages(
  roomId: string,
  onChange: ChangeListener,
): () => void {
  const subscribe = createPostgresChangeSubscription(`local_community_messages_${roomId}`, [
    {
      event: '*',
      schema: 'public',
      table: 'local_community_messages',
      filter: `room_id=eq.${roomId}`,
    },
  ]);
  return subscribe(onChange);
}

export function subscribeUserQuestionsChanges(
  userId: string,
  onChange: ChangeListener,
): () => void {
  const subscribe = createPostgresChangeSubscription(`user_questions_live_${userId}`, [
    {
      event: '*',
      schema: 'public',
      table: QUESTIONS_TABLE,
      filter: `user_id=eq.${userId}`,
    },
  ]);
  return subscribe(onChange);
}

export function subscribePendingQuestionsChanges(onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription('pending_questions_live', [
    {
      event: '*',
      schema: 'public',
      table: QUESTIONS_TABLE,
    },
  ]);
  return subscribe(onChange);
}

export function subscribeEmsChatRoomMessages(
  roomId: string,
  onChange: ChangeListener,
): () => void {
  const subscribe = createPostgresChangeSubscription(`ems_chat_room_messages_${roomId}`, [
    {
      event: '*',
      schema: 'public',
      table: 'ems_community_posts',
      filter: `room_id=eq.${roomId}`,
    },
  ]);
  return subscribe(onChange);
}

/** user_profiles UPDATE — 채널 단일화(중복 subscribe 방지) */
export function subscribeUserProfileChanges(userId: string, onChange: ChangeListener): () => void {
  const subscribe = createPostgresChangeSubscription(`user_profile_${userId}`, [
    {
      event: 'UPDATE',
      schema: 'public',
      table: USER_PROFILES_TABLE,
      filter: `id=eq.${userId}`,
    },
  ]);
  return subscribe(onChange);
}
