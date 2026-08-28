import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppHeaderOverride = {
  title?: string;
  hidden?: boolean;
  showBack?: boolean;
  onBack?: () => void;
};

type AppHeaderContextValue = {
  override: AppHeaderOverride | null;
  setOverride: (next: AppHeaderOverride | null) => void;
};

const AppHeaderContext = createContext<AppHeaderContextValue | null>(null);

export function AppHeaderProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<AppHeaderOverride | null>(null);

  const setOverride = useCallback((next: AppHeaderOverride | null) => {
    setOverrideState((prev) => {
      if (prev === next) return prev;
      if (!prev || !next) return next;
      if (
        prev.title === next.title &&
        prev.hidden === next.hidden &&
        prev.showBack === next.showBack &&
        prev.onBack === next.onBack
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      override,
      setOverride,
    }),
    [override, setOverride],
  );

  return <AppHeaderContext.Provider value={value}>{children}</AppHeaderContext.Provider>;
}

export function useAppHeaderContext(): AppHeaderContextValue {
  const ctx = useContext(AppHeaderContext);
  if (!ctx) {
    throw new Error('useAppHeaderContext must be used within AppHeaderProvider');
  }
  return ctx;
}
