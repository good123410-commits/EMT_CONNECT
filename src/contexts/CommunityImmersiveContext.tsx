import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type CommunityImmersiveContextValue = {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
};

const CommunityImmersiveContext = createContext<CommunityImmersiveContextValue | null>(null);

export function CommunityImmersiveProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersiveState] = useState(false);
  const setImmersive = useCallback((value: boolean) => {
    setImmersiveState(value);
  }, []);

  const value = useMemo(
    () => ({
      immersive,
      setImmersive,
    }),
    [immersive, setImmersive],
  );

  return (
    <CommunityImmersiveContext.Provider value={value}>{children}</CommunityImmersiveContext.Provider>
  );
}

export function useCommunityImmersive(): CommunityImmersiveContextValue {
  const ctx = useContext(CommunityImmersiveContext);
  if (!ctx) {
    return {
      immersive: false,
      setImmersive: () => {},
    };
  }
  return ctx;
}
