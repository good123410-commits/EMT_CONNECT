import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

type ChangeListener = () => void;

function createTableSubscription(table: string, channelName: string) {
  const listeners = new Set<ChangeListener>();
  let channel: RealtimeChannel | null = null;

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const ensureChannel = () => {
    if (channel) return;

    channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => notify())
      .subscribe();
  };

  return (onChange: ChangeListener): (() => void) => {
    listeners.add(onChange);
    ensureChannel();

    return () => {
      listeners.delete(onChange);
      if (listeners.size === 0 && channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  };
}

export const subscribeEmergencyGuidesTable = createTableSubscription(
  'emergency_guides',
  'emergency_guides_live',
);

export const subscribeGuideCategoriesTable = createTableSubscription(
  'guide_categories',
  'guide_categories_live',
);
