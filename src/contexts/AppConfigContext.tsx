import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { KAKAOTALK_PAY_LINK_FALLBACK } from '@/constants/appSettings';
import { fetchAppSettings, subscribeAppSettings } from '@/services/appSettingsService';

type AppConfigContextValue = {
  kakaoTalkPayLink: string;
  loading: boolean;
  reload: () => Promise<void>;
};

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [kakaoTalkPayLink, setKakaoTalkPayLink] = useState(KAKAOTALK_PAY_LINK_FALLBACK);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await fetchAppSettings();
      setKakaoTalkPayLink(settings.kakaotalk_pay_link);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return subscribeAppSettings(() => {
      void reload();
    });
  }, [reload]);

  const value = useMemo(
    () => ({
      kakaoTalkPayLink,
      loading,
      reload,
    }),
    [kakaoTalkPayLink, loading, reload],
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig(): AppConfigContextValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return ctx;
}
