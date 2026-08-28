import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { ThemeRoot } from '@/components/theme/ThemeRoot';
import { AuthProvider } from '@/contexts/AuthContext';
import { PushNotificationProvider } from '@/contexts/PushNotificationContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';
import { AppThemeProvider, useAppTheme } from '@/contexts/AppThemeContext';
import { UserRoleProvider } from '@/contexts/UserRoleContext';
import { ShortcodeComposerProvider } from '@/contexts/ShortcodeComposerContext';
import { ShortcodeRegistryProvider } from '@/contexts/ShortcodeRegistryContext';
import { WalletProvider } from '@/contexts/WalletContext';
// DISABLED: 비상연락망 & 응급카드 (ICE)
// import { EmergencyOverlayBootstrap } from '@/components/utilities/EmergencyOverlayBootstrap';
// import { EmergencyQuickViewBootstrap } from '@/components/utilities/EmergencyQuickViewBootstrap';
import { AppLaunchGate } from '@/components/intro/AppLaunchGate';
import { BrandSplashView } from '@/components/intro/BrandSplashView';
import { BookmarkToast } from '@/components/bookmarks/BookmarkToast';
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
  const { statusBarStyle } = useAppTheme();
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
        <PushNotificationProvider>
          <AppLaunchGate>
          <UserRoleProvider>
            <ShortcodeRegistryProvider>
              <ShortcodeComposerProvider>
                <BookmarkProvider>
                  <WalletProvider>
                    <ThemeRoot style={styles.root}>
                      <StatusBar style={statusBarStyle} />
                      <AppNavigation />
                      <BookmarkToast />
                      {DevRoleCheatMenu ? <DevRoleCheatMenu /> : null}
                    </ThemeRoot>
                  </WalletProvider>
                </BookmarkProvider>
              </ShortcodeComposerProvider>
            </ShortcodeRegistryProvider>
          </UserRoleProvider>
        </AppLaunchGate>
        </PushNotificationProvider>
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
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <AppThemeProvider>
            {booted ? <AppProviders /> : <AppShell />}
          </AppThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
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
