import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';

export type HospitalTabParamList = {
  Dashboard: undefined;
  Map: undefined;
  Rewards: undefined;
};

const Tab = createBottomTabNavigator<HospitalTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

const HospitalDashboardScreen = createDeferredScreen(
  () => require('@/screens/dashboard/HospitalDashboardScreen').HospitalDashboardScreen,
);
const MapScreen = createDeferredScreen(() => require('@/screens/MapScreen').MapScreen);
const RewardsScreen = createDeferredScreen(() => require('@/screens/RewardsScreen').RewardsScreen);

export function HospitalTabNavigator() {
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: '#1d4ed8',
    inactiveTintColor: '#94a3b8',
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    labelFontSize: 11,
  });

  return (
    <Tab.Navigator
      screenOptions={{
        ...screenOptions,
        lazy: true,
      }}
      safeAreaInsets={safeAreaInsets}
    >
      <Tab.Screen
        name="Dashboard"
        component={HospitalDashboardScreen}
        options={{
          tabBarLabel: '관제',
          tabBarIcon: ({ color }) => <TabBarIcon name="medical-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: '지도',
          tabBarIcon: ({ color }) => <TabBarIcon name="map-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarLabel: '리워드',
          tabBarIcon: ({ color }) => <TabBarIcon name="gift-outline" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
