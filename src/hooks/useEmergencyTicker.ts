import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribeHomeEmergencyNotices } from '@/lib/realtimeSubscription';
import { fetchActiveEmergencyTickerItems } from '@/services/emergencyTickerService';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';

export function useEmergencyTicker() {
  const [items, setItems] = useState<EmergencyTickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchActiveEmergencyTickerItems();
      setItems(rows);
    } catch (error) {
      if (__DEV__) {
        console.warn('[useEmergencyTicker] refresh failed:', error);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeHomeEmergencyNotices(() => {
      void refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const displayItems = useMemo(() => items.filter((item) => item.message.trim().length > 0), [items]);

  return { items: displayItems, loading, refresh };
}
