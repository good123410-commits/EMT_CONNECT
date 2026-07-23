import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { OpeningMontage } from '@/components/intro/OpeningMontage';
import { getCurrentRootRoute } from '@/navigation/rootNavigation';
import { navigationRef } from '@/navigation/navigationRef';
import {
  clearOpeningIntroSnooze,
  shouldShowOpeningIntro,
  snoozeOpeningIntroForDay,
} from '@/utils/openingIntroStorage';

type OpeningIntroContextValue = {
  /** 설정 등에서 즉시 인트로 재생 */
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
  rootRoute: string | undefined;
};

export function OpeningIntroProvider({ children, rootRoute }: OpeningIntroProviderProps) {
  const [visible, setVisible] = useState(false);
  const sessionDismissedRef = useRef(false);
  const forceReplayRef = useRef(false);
  const evaluatingRef = useRef(false);

  const evaluateGate = useCallback(async () => {
    if (evaluatingRef.current) return;
    if (rootRoute !== 'Main') return;
    if (sessionDismissedRef.current && !forceReplayRef.current) return;

    evaluatingRef.current = true;
    try {
      if (forceReplayRef.current) {
        forceReplayRef.current = false;
        setVisible(true);
        return;
      }

      const shouldShow = await shouldShowOpeningIntro();
      if (shouldShow && !sessionDismissedRef.current) {
        setVisible(true);
      }
    } finally {
      evaluatingRef.current = false;
    }
  }, [rootRoute]);

  useEffect(() => {
    if (!navigationRef.isReady()) return;
    void evaluateGate();
  }, [evaluateGate, rootRoute]);

  const handleComplete = useCallback(async ({ hideForDay }: { hideForDay: boolean }) => {
    sessionDismissedRef.current = true;
    setVisible(false);
    if (hideForDay) {
      await snoozeOpeningIntroForDay();
    }
  }, []);

  const replayOpeningIntro = useCallback(() => {
    if (getCurrentRootRoute() !== 'Main') return;
    forceReplayRef.current = true;
    sessionDismissedRef.current = false;
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
      <OpeningMontage visible={visible} onComplete={handleComplete} />
    </OpeningIntroContext.Provider>
  );
}
