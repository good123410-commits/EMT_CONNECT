import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SettingsBottomSheetModal } from '@/components/settings/SettingsBottomSheetModal';

type SettingsMenuContextValue = {
  openSettings: (initialAction?: string) => void;
  closeSettings: () => void;
};

const SettingsMenuContext = createContext<SettingsMenuContextValue | null>(null);

export function useSettingsMenu(): SettingsMenuContextValue {
  const ctx = useContext(SettingsMenuContext);
  if (!ctx) {
    throw new Error('useSettingsMenu must be used within SettingsMenuProvider');
  }
  return ctx;
}

/** 설정 하단 시트 밖(레거시 SettingsScreen 등)에서는 null */
export function useSettingsMenuOptional(): SettingsMenuContextValue | null {
  return useContext(SettingsMenuContext);
}

export function SettingsMenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [initialAction, setInitialAction] = useState<string | undefined>(undefined);

  const openSettings = useCallback((action?: string) => {
    setInitialAction(action);
    setVisible(true);
  }, []);
  const closeSettings = useCallback(() => {
    setVisible(false);
    setInitialAction(undefined);
  }, []);

  const value = useMemo(
    () => ({
      openSettings,
      closeSettings,
    }),
    [openSettings, closeSettings],
  );

  return (
    <SettingsMenuContext.Provider value={value}>
      {children}
      <SettingsBottomSheetModal 
        visible={visible} 
        onClose={closeSettings} 
        initialAction={initialAction}
      />
    </SettingsMenuContext.Provider>
  );
}
