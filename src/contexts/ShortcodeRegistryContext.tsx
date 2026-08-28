import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BUILTIN_CONTENT_SHORTCODES,
  fetchActiveContentShortcodes,
  subscribeContentShortcodes,
} from '@/services/shortcodeService';
import type { ContentShortcode } from '@/types/shortcode';

type ShortcodeRegistryContextValue = {
  shortcodes: ContentShortcode[];
  loading: boolean;
  reload: () => Promise<void>;
};

const ShortcodeRegistryContext = createContext<ShortcodeRegistryContextValue | null>(null);

export function ShortcodeRegistryProvider({ children }: { children: ReactNode }) {
  const [shortcodes, setShortcodes] = useState<ContentShortcode[]>(BUILTIN_CONTENT_SHORTCODES);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchActiveContentShortcodes();
      setShortcodes(rows);
    } catch {
      setShortcodes(BUILTIN_CONTENT_SHORTCODES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => subscribeContentShortcodes(() => void reload()), [reload]);

  const value = useMemo(
    () => ({
      shortcodes,
      loading,
      reload,
    }),
    [shortcodes, loading, reload],
  );

  return (
    <ShortcodeRegistryContext.Provider value={value}>{children}</ShortcodeRegistryContext.Provider>
  );
}

export function useShortcodeRegistry(): ShortcodeRegistryContextValue {
  const ctx = useContext(ShortcodeRegistryContext);
  if (!ctx) {
    return {
      shortcodes: BUILTIN_CONTENT_SHORTCODES,
      loading: false,
      reload: async () => undefined,
    };
  }
  return ctx;
}
