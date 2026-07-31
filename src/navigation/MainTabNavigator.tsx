import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { APP_ICON_SIZE } from '@/constants/appTheme';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { useMainTabBarConfig } from '@/navigation/mainTabBarOptions';

export type MainTabParamList = {
  Home: undefined;
  Guide: undefined;
  Chemical: undefined;
  Map: { initialTab?: 'aed' | 'er' | 'pharmacy' | 'pediatric' } | undefined;
  EmsCall: undefined;
  Paramedic: undefined;
  Settings: undefined;
};

/** @deprecated MainTabParamList 사용 */
export type PublicTabParamList = MainTabParamList;

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconConfig = {
  active: AppIconName;
  inactive: AppIconName;
};

function TabBarIcon({
  config,
  color,
  focused,
}: {
  config: TabIconConfig;
  color: string;
  focused: boolean;
}) {
  return (
    <AppIcon
      name={focused ? config.active : config.inactive}
      size={focused ? APP_ICON_SIZE.tab : APP_ICON_SIZE.md}
      color={color}
    />
  );
}

const TAB_ICONS: Record<string, TabIconConfig> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Guide: { active: 'medical-bag', inactive: 'medical-bag' },
  Chemical: { active: 'flask', inactive: 'flask-outline' },
  Map: { active: 'map', inactive: 'map-outline' },
  EmsCall: { active: 'car', inactive: 'car-outline' },
  Paramedic: { active: 'account-group', inactive: 'account-group-outline' },
  Settings: { active: 'cog', inactive: 'cog-outline' },
};

const HomeScreen = createDeferredScreen(() => require('@/screens/HomeScreen').HomeScreen);
const EmergencyGuideScreen = createDeferredScreen(
  () => require('@/screens/EmergencyGuideScreen').EmergencyGuideScreen,
);
const ChemicalScreen = createDeferredScreen(() => require('@/screens/ChemicalScreen').ChemicalScreen);
const MapScreen = createDeferredScreen(() => require('@/screens/MapScreen').MapScreen);
const PrivateEmsCallScreen = createDeferredScreen(
  () => require('@/screens/PrivateEmsCallScreen').PrivateEmsCallScreen,
);
const SettingsStackNavigator = createDeferredScreen(
  () => require('@/navigation/SettingsStackNavigator').SettingsStackNavigator,
);
const ParamedicGateScreen = createDeferredScreen(
  () => require('@/screens/ParamedicGateScreen').ParamedicGateScreen,
);

export function MainTabNavigator() {
  const { screenOptions, safeAreaInsets } = useMainTabBarConfig();

  return (
    <Tab.Navigator
      safeAreaInsets={safeAreaInsets}
      screenOptions={{
        ...screenOptions,
        lazy: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Guide"
        component={EmergencyGuideScreen}
        options={{
          tabBarLabel: '응급 가이드',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.Guide} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Chemical"
        component={ChemicalScreen}
        options={{
          tabBarLabel: '약물/화학',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.Chemical} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: '지도',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.Map} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="EmsCall"
        component={PrivateEmsCallScreen}
        options={{
          tabBarLabel: '민간 구급차',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.EmsCall} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Paramedic"
        component={ParamedicGateScreen}
        options={{
          tabBarLabel: EMS_COMMUNITY_TAB_LABEL,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.Paramedic} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.Settings} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/** @deprecated MainTabNavigator 사용 */
export const PublicTabNavigator = MainTabNavigator;
