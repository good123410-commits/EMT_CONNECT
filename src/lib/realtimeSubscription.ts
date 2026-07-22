import type {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
} from '@supabase/supabase-js';
import { QUESTIONS_TABLE, supabase } from '@/lib/supabaseClient';

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
