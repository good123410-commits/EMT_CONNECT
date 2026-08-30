import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribeHomeEmergencyNotices } from '@/lib/realtimeSubscription';
import { fetchActiveEmergencyTickerItems } from '@/services/emergencyTickerService';
import {
  getLocationWithRegionImmediate,
  subscribeToLocationUpdates,
  type LocationSnapshot,
} from '@/services/locationService';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';
import { processEmergencyTickerForDisplay } from '@/utils/emergencyTickerRegionalPipeline';
import { normalizeTickerItems } from '@/utils/emergencyTickerDisplay';

export function useEmergencyTicker() {
  const [items, setItems] = useState<EmergencyTickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationSnapshot, setLocationSnapshot] = useState<LocationSnapshot>(() =>
    getLocationWithRegionImmediate(),
  );

  const refresh = useCallback(async () => {
    try {
      const rows = await Promise.race([
        fetchActiveEmergencyTickerItems(),
        new Promise<EmergencyTickerItem[]>((resolve) => {
          setTimeout(() => resolve([]), 20_000);
        }),
      ]);
      setItems(normalizeTickerItems(rows));
    } catch (error) {
      if (__DEV__) {
        console.warn('[useEmergencyTicker] refresh failed:', error);
      }
      setItems((prev) => (prev.length > 0 ? prev : []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsubscribeNotices = subscribeHomeEmergencyNotices(() => {
      void refresh();
    });
    const unsubscribeLocation = subscribeToLocationUpdates(setLocationSnapshot);
    return () => {
      unsubscribeNotices();
      unsubscribeLocation();
    };
  }, [refresh]);

  const locationFilteredItems = useMemo(
    () => processEmergencyTickerForDisplay(items, locationSnapshot.region),
    [items, locationSnapshot.region],
  );

  const displayItems = useMemo(
    () => locationFilteredItems.filter((item) => item.message.trim().length > 0),
    [locationFilteredItems],
  );

  return {
    items: displayItems,
    allItems: items,
    region: locationSnapshot.region,
    loading,
    refresh,
  };
}
