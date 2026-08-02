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
  openSettings: () => void;
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

export function SettingsMenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const openSettings = useCallback(() => setVisible(true), []);
  const closeSettings = useCallback(() => setVisible(false), []);

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
      <SettingsBottomSheetModal visible={visible} onClose={closeSettings} />
    </SettingsMenuContext.Provider>
  );
}
