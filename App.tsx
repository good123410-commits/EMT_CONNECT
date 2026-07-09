import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserRoleProvider } from '@/contexts/UserRoleContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { RootNavigator } from '@/navigation/RootNavigator';

import './src/global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserRoleProvider>
          <WalletProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </WalletProvider>
        </UserRoleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
