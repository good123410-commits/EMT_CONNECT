import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ParamedicTabLayoutContext } from '@/navigation/paramedicTabLayout';
import type { ParamedicWriteTab } from '@/navigation/paramedicWriteTab';
import { ParamedicCommunityProvider, useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { EmsCaseStudyScreen } from '@/screens/emsCommunity/EmsCaseStudyScreen';
import { EmsChatRoomsScreen } from '@/screens/emsCommunity/EmsChatRoomsScreen';
import { EmsResourcesScreen } from '@/screens/emsCommunity/EmsResourcesScreen';
import { ParamedicJobsScreen } from '@/screens/expert/paramedic/ParamedicJobsScreen';
import { EmsQaBoardScreen } from '@/screens/emsCommunity/EmsQaBoardScreen';
import { LoungeFab } from '@/components/emsCommunity/loungeUi';
import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';

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
  const { invokeTabWriteHandler, activeWriteTab, setActiveWriteTab } = useParamedicCommunity();
  const { isDbAdmin, opsAdminVerified } = useExpertSettingsAccess();
  const isAdmin = isDbAdmin || opsAdminVerified;
  const canManageResources = isDbAdmin;
  const { lounge } = useEmsLoungeTheme();
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

  const fabLabels: Record<ParamedicWriteTab, string> = {
    QaBoard: '질문 작성',
    CaseStudy: '케이스 작성',
    ChatRooms: '채팅방 개설하기',
    Resources: canManageResources ? '자료 등록' : '자료 등록 (관리자 전용)',
    Jobs: '구인·구직 글쓰기',
  };

  return (
    <View className="flex-1">
      <Tab.Navigator screenOptions={screenOptions} safeAreaInsets={safeAreaInsets}>
        <Tab.Screen
          name="QaBoard"
          component={ParamedicQaBoardScreen}
          listeners={{ focus: () => setActiveWriteTab('QaBoard') }}
          options={{
            tabBarLabel: '질문함',
          }}
        />
        <Tab.Screen
          name="CaseStudy"
          component={EmsCaseStudyScreen}
          listeners={{ focus: () => setActiveWriteTab('CaseStudy') }}
          options={{
            tabBarLabel: '케이스',
          }}
        />
        <Tab.Screen
          name="ChatRooms"
          component={EmsChatRoomsScreen}
          listeners={{ focus: () => setActiveWriteTab('ChatRooms') }}
          options={{
            tabBarLabel: '소통창',
          }}
        />
        <Tab.Screen
          name="Resources"
          component={EmsResourcesScreen}
          listeners={{ focus: () => setActiveWriteTab('Resources') }}
          options={{
            tabBarLabel: '자료실',
          }}
        />
        <Tab.Screen
          name="Jobs"
          component={ParamedicJobsScreen}
          listeners={{ focus: () => setActiveWriteTab('Jobs') }}
          options={{
            tabBarLabel: '구인구직',
          }}
        />
      </Tab.Navigator>
      <LoungeFab
        onPress={() => invokeTabWriteHandler()}
        accessibilityLabel={fabLabels[activeWriteTab]}
        avoidGlobalMoreFab
      />
    </View>
  );
}

/**
 * EMS 커뮤니티(미래회) — 승인된 준회원·정회원 전용 서브 탭.
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
