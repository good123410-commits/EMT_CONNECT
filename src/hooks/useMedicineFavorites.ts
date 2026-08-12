import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { MedicineInfo } from '@/services/emergencyApi';
import {
  fetchMedicineFavorites,
  MedicineFavoriteServiceError,
  toggleMedicineFavorite,
  type MedicineFavorite,
} from '@/services/medicineFavoriteService';
import { findLocalMedicineBySeq } from '@/services/medicineStore';

export function useMedicineFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<MedicineFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingSeq, setTogglingSeq] = useState<string | null>(null);

  const favoriteSeqSet = useMemo(
    () => new Set(favorites.map((item) => item.itemSeq)),
    [favorites],
  );

  const reload = useCallback(async () => {
    if (!user?.id) {
      setFavorites([]);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchMedicineFavorites();
      setFavorites(rows);
      setError(null);
    } catch (err) {
      const message =
        err instanceof MedicineFavoriteServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : '즐겨찾기를 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isFavorite = useCallback(
    (itemSeq: string | undefined | null) => {
      const normalized = itemSeq?.trim();
      if (!normalized) return false;
      return favoriteSeqSet.has(normalized);
    },
    [favoriteSeqSet],
  );

  const favoriteMedicines = useMemo(() => {
    const items: MedicineInfo[] = [];
    for (const favorite of favorites) {
      const medicine = findLocalMedicineBySeq(favorite.itemSeq);
      if (medicine) {
        items.push(medicine);
      }
    }
    return items;
  }, [favorites]);

  const toggleFavorite = useCallback(
    async (medicine: MedicineInfo): Promise<boolean> => {
      const itemSeq = medicine.itemSeq?.trim();
      if (!itemSeq) {
        throw new MedicineFavoriteServiceError('품목 코드가 없어 즐겨찾기에 추가할 수 없습니다.');
      }

      const itemName = medicine.itemName?.trim() || '의약품';
      const wasFavorite = favoriteSeqSet.has(itemSeq);

      setTogglingSeq(itemSeq);
      try {
        const nextFavorite = await toggleMedicineFavorite(itemSeq, itemName, wasFavorite);
        setFavorites((prev) => {
          if (nextFavorite) {
            const without = prev.filter((item) => item.itemSeq !== itemSeq);
            return [
              { id: `local-${itemSeq}`, itemSeq, itemName, createdAt: new Date().toISOString() },
              ...without,
            ];
          }
          return prev.filter((item) => item.itemSeq !== itemSeq);
        });
        setError(null);
        return nextFavorite;
      } catch (err) {
        const message =
          err instanceof MedicineFavoriteServiceError
            ? err.message
            : err instanceof Error
              ? err.message
              : '즐겨찾기 변경에 실패했습니다.';
        setError(message);
        throw err;
      } finally {
        setTogglingSeq(null);
      }
    },
    [favoriteSeqSet],
  );

  return {
    user,
    favorites,
    favoriteSeqSet,
    favoriteMedicines,
    loading,
    error,
    togglingSeq,
    isFavorite,
    toggleFavorite,
    reload,
  };
}
