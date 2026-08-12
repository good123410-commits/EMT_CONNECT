import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PrivateEmsDispatchProvider } from '@/contexts/PrivateEmsDispatchContext';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { useThemedColors } from '@/hooks/useThemedColors';
import { PrivateEmsCallboardScreen } from '@/screens/expert/privateEms/PrivateEmsCallboardScreen';
import { PrivateEmsEmptyVehicleScreen } from '@/screens/expert/privateEms/PrivateEmsEmptyVehicleScreen';
import { PrivateEmsMyControlScreen } from '@/screens/expert/privateEms/PrivateEmsMyControlScreen';

export type PrivateEmsTabParamList = {
  Callboard: undefined;
  EmptyVehicle: undefined;
  MyControl: undefined;
};

const Tab = createBottomTabNavigator<PrivateEmsTabParamList>();

function TabBarIcon({ name, color }: { name: AppIconName; color: string }) {
  return <AppIcon name={name} size={24} color={color} />;
}

/**
 * 사설 구급차 전용 Root Tab Navigator.
 */
export function PrivateEmsTabNavigator() {
  const { colors } = useThemedColors();
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: '#F97316',
    inactiveTintColor: colors.tabInactive,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    labelFontSize: 11,
  });

  return (
    <PrivateEmsDispatchProvider>
      <Tab.Navigator screenOptions={screenOptions} safeAreaInsets={safeAreaInsets}>
        <Tab.Screen
          name="Callboard"
          component={PrivateEmsCallboardScreen}
          options={{
            tabBarLabel: '정기 콜보드',
            tabBarIcon: ({ color }) => <TabBarIcon name="format-list-bulleted" color={color} />,
          }}
        />
        <Tab.Screen
          name="EmptyVehicle"
          component={PrivateEmsEmptyVehicleScreen}
          options={{
            tabBarLabel: '공차 매칭',
            tabBarIcon: ({ color }) => <TabBarIcon name="swap-horizontal" color={color} />,
          }}
        />
        <Tab.Screen
          name="MyControl"
          component={PrivateEmsMyControlScreen}
          options={{
            tabBarLabel: '내 관제',
            tabBarIcon: ({ color }) => <TabBarIcon name="speedometer" color={color} />,
          }}
        />
      </Tab.Navigator>
    </PrivateEmsDispatchProvider>
  );
}
