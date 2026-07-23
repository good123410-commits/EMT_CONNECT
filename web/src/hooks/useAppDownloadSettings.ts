import { useCallback, useEffect, useState } from 'react';
import {
  fetchAppDownloadSettings,
  mergeAppDownloadSettings,
  subscribeAppDownloadSettings,
} from '../services/appDownloadService';
import type { AppDownloadSettings } from '../types';

export function useAppDownloadSettings() {
  const [settings, setSettings] = useState<AppDownloadSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const row = await fetchAppDownloadSettings();
      setSettings(mergeAppDownloadSettings(row));
      setError(null);
    } catch (err) {
      setSettings(mergeAppDownloadSettings(null));
      setError(err instanceof Error ? err.message : '앱 다운로드 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeAppDownloadSettings(() => void reload());
    return unsubscribe;
  }, [reload]);

  return { settings, loading, error, reload };
}
