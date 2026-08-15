import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { AppChrome } from '@/components/navigation/AppChrome';
import { DraggableMoreFab } from '@/components/navigation/DraggableMoreFab';
import { AppConfigProvider } from '@/contexts/AppConfigContext';
import { AppHeaderProvider } from '@/contexts/AppHeaderContext';
import { SettingsMenuProvider } from '@/contexts/SettingsMenuContext';
import { MoreMenuModal } from '@/components/utilities/MoreMenuModal';
import type { UtilityToolRoute } from '@/constants/utilityTools';
import { navigateToChemicalScreen } from '@/navigation/mainTabNavigation';
import { navigateToUtilityTool } from '@/navigation/utilityNavigation';

type MoreMenuContextValue = {
  openMoreMenu: () => void;
  closeMoreMenu: () => void;
  openUtilityTool: (route: UtilityToolRoute) => void;
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

  const openMoreMenu = useCallback(() => setVisible(true), []);
  const closeMoreMenu = useCallback(() => setVisible(false), []);

  const openUtilityTool = useCallback((route: UtilityToolRoute) => {
    setVisible(false);
    requestAnimationFrame(() => {
      navigateToUtilityTool(route);
    });
  }, []);

  const openChemicalInfo = useCallback(() => {
    setVisible(false);
    requestAnimationFrame(() => {
      navigateToChemicalScreen();
    });
  }, []);

  const value = useMemo(
    () => ({
      openMoreMenu,
      closeMoreMenu,
      openUtilityTool,
    }),
    [openMoreMenu, closeMoreMenu, openUtilityTool],
  );

  return (
    <AppConfigProvider>
      <AppHeaderProvider>
      <SettingsMenuProvider>
      <MoreMenuContext.Provider value={value}>
        <View style={{ flex: 1 }}>
          <AppChrome />
          <View style={{ flex: 1 }}>{children}</View>
          <MoreMenuModal
            visible={visible}
            onClose={closeMoreMenu}
            onSelectTool={openUtilityTool}
            onOpenChemicalInfo={openChemicalInfo}
          />
          <DraggableMoreFab />
        </View>
      </MoreMenuContext.Provider>
      </SettingsMenuProvider>
      </AppHeaderProvider>
    </AppConfigProvider>
  );
}
