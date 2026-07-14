import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { useUserRole } from '@/contexts/UserRoleContext';
import { isExpertRole } from '@/utils/roleAccess';

export type MainTabParamList = {
  Home: undefined;
  Chemical: undefined;
  Map: undefined;
  EmsCall: undefined;
  Rewards: undefined;
  Hidden: undefined;
};

/** @deprecated MainTabParamList 사용 */
export type PublicTabParamList = MainTabParamList;

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

function HiddenTabBarButton(props: BottomTabBarButtonProps) {
  const { enterExpertMode } = useUserRole();

  return (
    <PlatformPressable
      {...props}
      onPress={() => {
        enterExpertMode();
      }}
    />
  );
}

const HomeScreen = createDeferredScreen(() => require('@/screens/HomeScreen').HomeScreen);
const ChemicalScreen = createDeferredScreen(() => require('@/screens/ChemicalScreen').ChemicalScreen);
const MapScreen = createDeferredScreen(() => require('@/screens/MapScreen').MapScreen);
const PrivateEmsCallScreen = createDeferredScreen(
  () => require('@/screens/PrivateEmsCallScreen').PrivateEmsCallScreen,
);
const RewardsScreen = createDeferredScreen(() => require('@/screens/RewardsScreen').RewardsScreen);
const HiddenChannelEntryScreen = createDeferredScreen(
  () => require('@/screens/HiddenChannelEntryScreen').HiddenChannelEntryScreen,
);

export function MainTabNavigator() {
  const { role } = useUserRole();
  const showHiddenTab = isExpertRole(role);

  return (
    <Tab.Navigator
      screenOptions={{
        lazy: true,
        headerShown: false,
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
          tabBarLabel: '가이드',
          tabBarIcon: ({ color }) => <TabBarIcon name="medkit-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Chemical"
        component={ChemicalScreen}
        options={{
          tabBarLabel: '약물/화학',
          tabBarIcon: ({ color }) => <TabBarIcon name="flask-outline" color={color} />,
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
        name="EmsCall"
        component={PrivateEmsCallScreen}
        options={{
          tabBarLabel: '구급차',
          tabBarIcon: ({ color }) => <TabBarIcon name="car-outline" color={color} />,
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
      <Tab.Screen
        name="Hidden"
        component={HiddenChannelEntryScreen}
        options={{
          tabBarLabel: '히든',
          tabBarIcon: ({ color }) => <TabBarIcon name="lock-closed-outline" color={color} />,
          tabBarActiveTintColor: '#7c3aed',
          tabBarItemStyle: showHiddenTab ? undefined : styles.hiddenTabItem,
          tabBarButton: showHiddenTab ? HiddenTabBarButton : () => null,
        }}
      />
    </Tab.Navigator>
  );
}

/** @deprecated MainTabNavigator 사용 */
export const PublicTabNavigator = MainTabNavigator;

const styles = {
  hiddenTabItem: {
    display: 'none' as const,
    width: 0,
    height: 0,
    overflow: 'hidden' as const,
  },
};
