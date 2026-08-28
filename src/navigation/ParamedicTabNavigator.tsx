import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ParamedicTabLayoutContext } from '@/navigation/paramedicTabLayout';
import { ParamedicCommunityProvider } from '@/contexts/ParamedicCommunityContext';
import { useCommunityImmersive } from '@/contexts/CommunityImmersiveContext';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { EmsCaseStudyScreen } from '@/screens/emsCommunity/EmsCaseStudyScreen';
import { EmsChatRoomsScreen } from '@/screens/emsCommunity/EmsChatRoomsScreen';
import { EmsResourcesScreen } from '@/screens/emsCommunity/EmsResourcesScreen';
import { ParamedicJobsScreen } from '@/screens/expert/paramedic/ParamedicJobsScreen';
import { EmsQaBoardScreen } from '@/screens/emsCommunity/EmsQaBoardScreen';

export type ParamedicTabParamList = {
  QaBoard: undefined;
  CaseStudy: undefined;
  ChatRooms: undefined;
  Resources: undefined;
  Jobs: undefined;
};

const Tab = createBottomTabNavigator<ParamedicTabParamList>();

function TabBarIcon({ name, color }: { name: AppIconName; color: string }) {
  return <AppIcon name={name} size={22} color={color} />;
}

function ParamedicQaBoardScreen() {
  return <EmsQaBoardScreen variant="paramedic" />;
}

function ParamedicTabNavigatorContent({
  nestedAboveMainTabBar = true,
}: {
  nestedAboveMainTabBar?: boolean;
}) {
  const { lounge } = useEmsLoungeTheme();
  const { immersive } = useCommunityImmersive();
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: lounge.accent,
    inactiveTintColor: lounge.textMuted,
    backgroundColor: lounge.background,
    borderTopColor: lounge.border,
    labelFontSize: 13,
    compactLayout: false,
    tabBarItemPaddingHorizontal: 2,
    nestedAboveMainTabBar,
    position: 'top',
    showBottomBorder: true,
  });

  return (
    <View className="flex-1">
      <Tab.Navigator
        screenOptions={{
          ...screenOptions,
          tabBarStyle: immersive
            ? { display: 'none', height: 0, overflow: 'hidden' }
            : screenOptions.tabBarStyle,
        }}
        safeAreaInsets={safeAreaInsets}
      >
        <Tab.Screen
          name="QaBoard"
          component={ParamedicQaBoardScreen}
          options={{
            tabBarLabel: '질문함',
          }}
        />
        <Tab.Screen
          name="CaseStudy"
          component={EmsCaseStudyScreen}
          options={{
            tabBarLabel: '케이스',
          }}
        />
        <Tab.Screen
          name="ChatRooms"
          component={EmsChatRoomsScreen}
          options={{
            tabBarLabel: '소통창',
          }}
        />
        <Tab.Screen
          name="Resources"
          component={EmsResourcesScreen}
          options={{
            tabBarLabel: '자료실',
          }}
        />
        <Tab.Screen
          name="Jobs"
          component={ParamedicJobsScreen}
          options={{
            tabBarLabel: '구인구직',
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

/**
 * EMS 커뮤니티(미래회) — 승인된 준회원·정회원 전용 서브 탭.
 * 글쓰기는 각 탭 화면 우측 하단 FAB으로 관리한다.
 */
export function ParamedicTabNavigator({
  nestedAboveMainTabBar = true,
}: {
  nestedAboveMainTabBar?: boolean;
} = {}) {
  return (
    <ParamedicTabLayoutContext.Provider value={{ nestedAboveMainTabBar }}>
      <ParamedicCommunityProvider>
        <ParamedicTabNavigatorContent nestedAboveMainTabBar={nestedAboveMainTabBar} />
      </ParamedicCommunityProvider>
    </ParamedicTabLayoutContext.Provider>
  );
}
