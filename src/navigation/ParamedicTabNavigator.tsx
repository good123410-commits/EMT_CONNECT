import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ParamedicCommunityProvider } from '@/contexts/ParamedicCommunityContext';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { ParamedicBambooForestScreen } from '@/screens/expert/paramedic/ParamedicBambooForestScreen';
import { ParamedicGroupBuyScreen } from '@/screens/expert/paramedic/ParamedicGroupBuyScreen';
import { ParamedicJobsScreen } from '@/screens/expert/paramedic/ParamedicJobsScreen';
import { ParamedicSurveyScreen } from '@/screens/expert/paramedic/ParamedicSurveyScreen';

export type ParamedicTabParamList = {
  BambooForest: undefined;
  Jobs: undefined;
  Survey: undefined;
  GroupBuy: undefined;
};

const Tab = createBottomTabNavigator<ParamedicTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

/**
 * 구급대원(paramedic) 전용 Root Tab Navigator.
 * 일반인용 탭과 완전 분리 — 4개 전용 탭만 존재.
 */
export function ParamedicTabNavigator() {
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: '#4ade80',
    inactiveTintColor: '#64748b',
    backgroundColor: '#14532d',
    borderTopColor: '#14532d',
    labelFontSize: 10,
  });

  return (
    <ParamedicCommunityProvider>
      <Tab.Navigator screenOptions={screenOptions} safeAreaInsets={safeAreaInsets}>
        <Tab.Screen
          name="BambooForest"
          component={ParamedicBambooForestScreen}
          options={{
            tabBarLabel: '비밀 대나무숲',
            tabBarIcon: ({ color }) => <TabBarIcon name="leaf-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="Jobs"
          component={ParamedicJobsScreen}
          options={{
            tabBarLabel: '구인/구직',
            tabBarIcon: ({ color }) => <TabBarIcon name="briefcase-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="Survey"
          component={ParamedicSurveyScreen}
          options={{
            tabBarLabel: '설문/후원',
            tabBarIcon: ({ color }) => <TabBarIcon name="clipboard-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="GroupBuy"
          component={ParamedicGroupBuyScreen}
          options={{
            tabBarLabel: '공동구매',
            tabBarIcon: ({ color }) => <TabBarIcon name="cart-outline" color={color} />,
          }}
        />
      </Tab.Navigator>
    </ParamedicCommunityProvider>
  );
}
