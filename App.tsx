import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserRoleProvider } from '@/contexts/UserRoleContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { EmergencyOverlayBootstrap } from '@/components/utilities/EmergencyOverlayBootstrap';
import { AppLaunchGate } from '@/components/intro/AppLaunchGate';
import { BrandSplashView } from '@/components/intro/BrandSplashView';
import { APP_COLORS } from '@/constants/appTheme';
import { useAppFonts } from '@/hooks/useAppFonts';
import { queryClient } from '@/lib/queryClient';
import { applyDefaultFont } from '@/utils/applyDefaultFont';

import './src/global.css';

function AppShell() {
  return (
    <View style={styles.shell}>
      <BrandSplashView showLoadingHint />
      <StatusBar style="light" />
    </View>
  );
}

import { V1_STORE_BUILD } from '@/constants/releaseFlags';

function AppProviders() {
  const { ready: fontsReady, loaded: fontsLoaded } = useAppFonts();
  const AppNavigation = require('@/navigation/AppNavigation').AppNavigation;

  const DevRoleCheatMenu =
    __DEV__ && !V1_STORE_BUILD
      ? require('@/components/DevRoleCheatMenu').DevRoleCheatMenu
      : null;

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFont();
    }
  }, [fontsLoaded]);

  if (!fontsReady) {
    return <AppShell />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLaunchGate>
          <UserRoleProvider>
            <WalletProvider>
              <View style={styles.root}>
                <EmergencyOverlayBootstrap />
                <AppNavigation />
                {DevRoleCheatMenu ? <DevRoleCheatMenu /> : null}
              </View>
            </WalletProvider>
          </UserRoleProvider>
        </AppLaunchGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (__DEV__) {
      console.log('[EMT_CONNECT] App 마운트');
    }
    const timer = setTimeout(() => setBooted(true), 32);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        {booted ? <AppProviders /> : <AppShell />}
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLORS.background,
  },
  root: {
    flex: 1,
  },
});
