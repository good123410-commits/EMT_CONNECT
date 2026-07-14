import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PrivateEmsDispatchProvider } from '@/contexts/PrivateEmsDispatchContext';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { PrivateEmsCallboardScreen } from '@/screens/expert/privateEms/PrivateEmsCallboardScreen';
import { PrivateEmsEmptyVehicleScreen } from '@/screens/expert/privateEms/PrivateEmsEmptyVehicleScreen';
import { PrivateEmsMyControlScreen } from '@/screens/expert/privateEms/PrivateEmsMyControlScreen';

export type PrivateEmsTabParamList = {
  Callboard: undefined;
  EmptyVehicle: undefined;
  MyControl: undefined;
};

const Tab = createBottomTabNavigator<PrivateEmsTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

/**
 * 사설 구급차(private_ems) 전용 Root Tab Navigator.
 * 일반인용 탭과 완전 분리 — 3개 전용 탭만 존재.
 */
export function PrivateEmsTabNavigator() {
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: '#f97316',
    inactiveTintColor: '#64748b',
    backgroundColor: '#0f172a',
    borderTopColor: '#1e293b',
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
            tabBarIcon: ({ color }) => <TabBarIcon name="list-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="EmptyVehicle"
          component={PrivateEmsEmptyVehicleScreen}
          options={{
            tabBarLabel: '공차 매칭',
            tabBarIcon: ({ color }) => <TabBarIcon name="swap-horizontal-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="MyControl"
          component={PrivateEmsMyControlScreen}
          options={{
            tabBarLabel: '내 관제',
            tabBarIcon: ({ color }) => <TabBarIcon name="speedometer-outline" color={color} />,
          }}
        />
      </Tab.Navigator>
    </PrivateEmsDispatchProvider>
  );
}
