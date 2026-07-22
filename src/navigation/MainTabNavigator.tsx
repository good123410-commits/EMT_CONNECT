import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { createDeferredScreen } from '@/navigation/deferredScreen';

export type MainTabParamList = {
  Home: undefined;
  Chemical: undefined;
  Map: undefined;
  EmsCall: undefined;
  Paramedic: undefined;
  Settings: undefined;
};

/** @deprecated MainTabParamList 사용 */
export type PublicTabParamList = MainTabParamList;

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

const HomeScreen = createDeferredScreen(() => require('@/screens/HomeScreen').HomeScreen);
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

/*
 * v1 스토어 심사: 리워드·히든 통합 탭 제거 → EMS 커뮤니티 탭 + 승인 게이트(ParamedicGateScreen)
 * 병원관계자 채널: ExpertModeNavigator에서 주석 처리
 * 구 설문/후원·공동구매 탭은 제거 — 외부 웹 링크만 자료실에서 제공
 *
 * <Tab.Screen name="Rewards" component={RewardsScreen} ... />
 * <Tab.Screen name="Hidden" component={HiddenChannelEntryScreen} ... />
 */

export function MainTabNavigator() {
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
          tabBarLabel: '민간 구급차',
          tabBarIcon: ({ color }) => <TabBarIcon name="car-outline" color={color} />,
        }}
      />
      <Tab.Screen
        name="Paramedic"
        component={ParamedicGateScreen}
        options={{
          tabBarLabel: EMS_COMMUNITY_TAB_LABEL,
          tabBarIcon: ({ color }) => <TabBarIcon name="people-outline" color={color} />,
          tabBarActiveTintColor: '#15803d',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings-outline" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/** @deprecated MainTabNavigator 사용 */
export const PublicTabNavigator = MainTabNavigator;
