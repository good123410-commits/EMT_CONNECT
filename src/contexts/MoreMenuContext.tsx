import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { MedicationInstantStartModal } from '@/components/utilities/MedicationInstantStartModal';
import { MedicationDeepLinkHandler } from '@/components/utilities/MedicationDeepLinkHandler';
import { MoreMenuModal } from '@/components/utilities/MoreMenuModal';
import type { UtilityToolRoute } from '@/constants/utilityTools';
import { navigateToUtilityTool } from '@/navigation/utilityNavigation';

type MoreMenuContextValue = {
  openMoreMenu: () => void;
  closeMoreMenu: () => void;
  openUtilityTool: (route: UtilityToolRoute) => void;
  openMedicationInstant: () => void;
};

const MoreMenuContext = createContext<MoreMenuContextValue | null>(null);

export function useMoreMenu(): MoreMenuContextValue {
  const ctx = useContext(MoreMenuContext);
  if (!ctx) {
    throw new Error('useMoreMenu must be used within MoreMenuProvider');
  }
  return ctx;
}

export function MoreMenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [medicationInstantVisible, setMedicationInstantVisible] = useState(false);

  const openMoreMenu = useCallback(() => setVisible(true), []);
  const closeMoreMenu = useCallback(() => setVisible(false), []);

  const openUtilityTool = useCallback((route: UtilityToolRoute) => {
    setVisible(false);
    requestAnimationFrame(() => {
      navigateToUtilityTool(route);
    });
  }, []);

  const openMedicationInstant = useCallback(() => {
    setMedicationInstantVisible(true);
  }, []);

  const value = useMemo(
    () => ({
      openMoreMenu,
      closeMoreMenu,
      openUtilityTool,
      openMedicationInstant,
    }),
    [openMoreMenu, closeMoreMenu, openUtilityTool, openMedicationInstant],
  );

  return (
    <MoreMenuContext.Provider value={value}>
      {children}
      <MedicationDeepLinkHandler onOpenInstant={openMedicationInstant} />
      <MoreMenuModal visible={visible} onClose={closeMoreMenu} onSelectTool={openUtilityTool} />
      <MedicationInstantStartModal
        visible={medicationInstantVisible}
        onClose={() => setMedicationInstantVisible(false)}
        onOpenFullScreen={() => openUtilityTool('MedicationLogTimer')}
      />
    </MoreMenuContext.Provider>
  );
}
