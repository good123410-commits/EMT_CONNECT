import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppOpeningOverlay } from '@/components/intro/AppOpeningOverlay';
import { getCurrentRootRoute } from '@/navigation/rootNavigation';
import { clearOpeningIntroSnooze, snoozeOpeningIntroForDay } from '@/utils/openingIntroStorage';

type OpeningIntroContextValue = {
  /** 설정 등에서 즉시 오프닝 재생 */
  replayOpeningIntro: () => void;
  /** 24시간 스누즈 해제 */
  resetOpeningIntroSnooze: () => Promise<void>;
};

const OpeningIntroContext = createContext<OpeningIntroContextValue | null>(null);

export function useOpeningIntro() {
  const ctx = useContext(OpeningIntroContext);
  if (!ctx) {
    throw new Error('useOpeningIntro must be used within OpeningIntroProvider');
  }
  return ctx;
}

type OpeningIntroProviderProps = {
  children: ReactNode;
};

export function OpeningIntroProvider({ children }: OpeningIntroProviderProps) {
  const [visible, setVisible] = useState(false);

  const handleComplete = useCallback(async ({ hideForDay }: { hideForDay: boolean }) => {
    setVisible(false);
    if (hideForDay) {
      await snoozeOpeningIntroForDay();
    }
  }, []);

  const replayOpeningIntro = useCallback(() => {
    if (getCurrentRootRoute() !== 'Main') return;
    setVisible(true);
  }, []);

  const resetOpeningIntroSnooze = useCallback(async () => {
    await clearOpeningIntroSnooze();
  }, []);

  const value = useMemo(
    () => ({
      replayOpeningIntro,
      resetOpeningIntroSnooze,
    }),
    [replayOpeningIntro, resetOpeningIntroSnooze],
  );

  return (
    <OpeningIntroContext.Provider value={value}>
      {children}
      <AppOpeningOverlay visible={visible} onComplete={handleComplete} />
    </OpeningIntroContext.Provider>
  );
}
