import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kemix_draggable_fab_position_v1';

export type FabStoredPosition = {
  x: number;
  y: number;
};

export function useFabPositionStorage() {
  const [position, setPosition] = useState<FabStoredPosition | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw) as FabStoredPosition;
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPosition(parsed);
          }
        } catch {
          // ignore corrupt storage
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistPosition = useCallback(async (next: FabStoredPosition) => {
    setPosition(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { position, ready, persistPosition };
}
