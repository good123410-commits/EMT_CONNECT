import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStack } from '@/navigation/AuthStack';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';

export function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return session ? <MainTabNavigator /> : <AuthStack />;
}
