import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribeHomeEmergencyNotices } from '@/lib/realtimeSubscription';
import { fetchActiveEmergencyTickerItems } from '@/services/emergencyTickerService';
import {
  getLocationWithRegionImmediate,
  subscribeToLocationUpdates,
  type LocationSnapshot,
} from '@/services/locationService';
import type { EmergencyTickerItem } from '@/types/emergencyTicker';
import { countBySource, logTickerPipeline, logTickerStage } from '@/utils/emergencyTickerDebug';
import {
  buildTickerDisplaySegments,
  normalizeTickerItems,
} from '@/utils/emergencyTickerDisplay';
import { processEmergencyTickerForDisplay } from '@/utils/emergencyTickerRegionalPipeline';

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
      const normalized = normalizeTickerItems(rows);
      logTickerStage('hook:refresh', {
        fetched: rows.length,
        normalized: normalized.length,
        bySource: countBySource(normalized),
      });
      setItems(normalized);
    } catch (error) {
      logTickerStage('hook:refresh:error', { error });
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

  const displayItems = useMemo(() => {
    const trimmed = locationFilteredItems.filter((item) => item.message.trim().length > 0);
    logTickerPipeline('hook:trim-empty', locationFilteredItems, trimmed);
    return trimmed;
  }, [locationFilteredItems]);

  useEffect(() => {
    if (!__DEV__) return;
    const segments = buildTickerDisplaySegments(displayItems);
    logTickerStage('hook:display-ready', {
      displayItems: displayItems.length,
      segments: segments.length,
      region: locationSnapshot.region,
      bySource: countBySource(displayItems),
    });
  }, [displayItems, locationSnapshot.region]);

  return {
    items: displayItems,
    allItems: items,
    region: locationSnapshot.region,
    loading,
    refresh,
  };
}
