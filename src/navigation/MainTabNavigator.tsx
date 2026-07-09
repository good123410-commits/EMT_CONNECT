import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useUserRole } from '@/contexts/UserRoleContext';
import { ChemicalScreen } from '@/screens/ChemicalScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { MapScreen } from '@/screens/MapScreen';
import { ProScreen } from '@/screens/ProScreen';
import { RewardsScreen } from '@/screens/RewardsScreen';

export type MainTabParamList = {
  Home: undefined;
  Chemical: undefined;
  Map: undefined;
  Rewards: undefined;
  Pro?: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export function MainTabNavigator() {
  const { isProUser } = useUserRole();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopColor: '#e2e8f0',
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: '가이드',
          tabBarIcon: ({ color }) => <TabBarIcon name="medkit-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Chemical"
        component={ChemicalScreen}
        options={{
          headerShown: false,
          tabBarLabel: '약물/화학',
          tabBarIcon: ({ color }) => <TabBarIcon name="flask-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerShown: false,
          tabBarLabel: '지도',
          tabBarIcon: ({ color }) => <TabBarIcon name="map-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          headerShown: false,
          tabBarLabel: '리워드',
          tabBarIcon: ({ color }) => <TabBarIcon name="gift-outline" color={color} />,
        }}
      />
      {isProUser ? (
        <Tab.Screen
          name="Pro"
          component={ProScreen}
          options={{
            title: 'PRO',
            tabBarLabel: 'PRO',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="shield-checkmark-outline" color={color} />
            ),
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
}
