import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDeferredScreen } from '@/navigation/deferredScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsScreen = createDeferredScreen(() => require('@/screens/SettingsScreen').SettingsScreen);
const AdminDashboardScreen = createDeferredScreen(
  () => require('@/screens/admin/AdminDashboardScreen').AdminDashboardScreen,
);

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
