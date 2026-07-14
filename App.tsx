import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserRoleProvider } from '@/contexts/UserRoleContext';
import { WalletProvider } from '@/contexts/WalletContext';

import './src/global.css';

function AppShell() {
  return (
    <View style={styles.shell}>
      <ActivityIndicator size="large" color="#dc2626" />
      <StatusBar style="auto" />
    </View>
  );
}

function AppProviders() {
  const AppNavigation = require('@/navigation/AppNavigation').AppNavigation;
  const DevRoleCheatMenu = __DEV__
    ? require('@/components/DevRoleCheatMenu').DevRoleCheatMenu
    : null;

  return (
    <AuthProvider>
      <UserRoleProvider>
        <WalletProvider>
          <View style={styles.root}>
            <AppNavigation />
            {DevRoleCheatMenu ? <DevRoleCheatMenu /> : null}
          </View>
        </WalletProvider>
      </UserRoleProvider>
    </AuthProvider>
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
    backgroundColor: '#ffffff',
  },
  root: {
    flex: 1,
  },
});
