import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { MainTabBar } from '@/components/navigation/MainTabBar';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { useMainTabBarConfig } from '@/navigation/mainTabBarOptions';
import type { MedicalMapTab } from '@/types/medicalMap';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  Home: undefined;
  Guide: undefined;
  Map: { initialTab?: MedicalMapTab } | undefined;
  Paramedic: undefined;
  All: undefined;
};

/** @deprecated MainTabParamList 사용 */
export type PublicTabParamList = MainTabParamList;

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconConfig = {
  active: AppIconName;
  inactive: AppIconName;
};

const MAIN_TAB_ICON_ACTIVE = 28;
const MAIN_TAB_ICON_INACTIVE = 26;

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
      size={focused ? MAIN_TAB_ICON_ACTIVE : MAIN_TAB_ICON_INACTIVE}
      color={color}
    />
  );
}

const TAB_ICONS: Record<string, TabIconConfig> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Guide: { active: 'medical-bag', inactive: 'medical-bag' },
  Map: { active: 'hospital-box', inactive: 'hospital-box-outline' },
  Paramedic: { active: 'account-group', inactive: 'account-group-outline' },
  All: { active: 'menu', inactive: 'menu' },
};

const HomeScreen = createDeferredScreen(() => require('@/screens/HomeScreen').HomeScreen);
const EmergencyGuideScreen = createDeferredScreen(
  () => require('@/screens/EmergencyGuideScreen').EmergencyGuideScreen,
);
const MapScreen = createDeferredScreen(() => require('@/screens/MapScreen').MapScreen);
const ParamedicGateScreen = createDeferredScreen(
  () => require('@/screens/ParamedicGateScreen').ParamedicGateScreen,
);
const AllServicesScreen = createDeferredScreen(
  () => require('@/screens/AllServicesScreen').AllServicesScreen,
);

export function MainTabNavigator() {
  const { screenOptions, safeAreaInsets } = useMainTabBarConfig();

  return (
    <Tab.Navigator
      safeAreaInsets={safeAreaInsets}
      tabBar={(props) => <MainTabBar {...props} />}
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
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: '의료정보',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.Map} color={color} focused={focused} />
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
        name="All"
        component={AllServicesScreen}
        options={{
          tabBarLabel: '전체',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon config={TAB_ICONS.All} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/** @deprecated MainTabNavigator 사용 */
export const PublicTabNavigator = MainTabNavigator;
