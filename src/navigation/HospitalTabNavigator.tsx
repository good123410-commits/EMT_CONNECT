import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { useThemedColors } from '@/hooks/useThemedColors';

export type HospitalTabParamList = {
  Dashboard: undefined;
  Map: undefined;
  Rewards: undefined;
};

const Tab = createBottomTabNavigator<HospitalTabParamList>();

function TabBarIcon({ name, color }: { name: AppIconName; color: string }) {
  return <AppIcon name={name} size={24} color={color} />;
}

const HospitalDashboardScreen = createDeferredScreen(
  () => require('@/screens/dashboard/HospitalDashboardScreen').HospitalDashboardScreen,
);
const MapScreen = createDeferredScreen(() => require('@/screens/MapScreen').MapScreen);
const RewardsScreen = createDeferredScreen(() => require('@/screens/RewardsScreen').RewardsScreen);

export function HospitalTabNavigator() {
  const { colors } = useThemedColors();
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: colors.blue,
    inactiveTintColor: colors.tabInactive,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
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
          tabBarIcon: ({ color }) => <TabBarIcon name="hospital-box-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          unmountOnBlur: true,
          freezeOnBlur: true,
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
