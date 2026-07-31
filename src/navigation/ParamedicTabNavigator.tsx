import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EMS_LOUNGE } from '@/constants/emsLoungeTheme';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { ParamedicCommunityProvider } from '@/contexts/ParamedicCommunityContext';
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

/**
 * EMS 커뮤니티(미래회) — 승인된 준회원·정회원 전용 서브 탭.
 */
export function ParamedicTabNavigator() {
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: EMS_LOUNGE.green,
    inactiveTintColor: EMS_LOUNGE.textMuted,
    backgroundColor: EMS_LOUNGE.surface,
    borderTopColor: EMS_LOUNGE.border,
    labelFontSize: 11,
  });

  return (
    <ParamedicCommunityProvider>
      <Tab.Navigator screenOptions={screenOptions} safeAreaInsets={safeAreaInsets}>
        <Tab.Screen
          name="QaBoard"
          component={ParamedicQaBoardScreen}
          options={{
            tabBarLabel: '질문함',
            tabBarIcon: ({ color }) => <TabBarIcon name="help-circle-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="CaseStudy"
          component={EmsCaseStudyScreen}
          options={{
            tabBarLabel: '케이스',
            tabBarIcon: ({ color }) => <TabBarIcon name="book-open-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="ChatRooms"
          component={EmsChatRoomsScreen}
          options={{
            tabBarLabel: '소통창',
            tabBarIcon: ({ color }) => <TabBarIcon name="chat-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="Resources"
          component={EmsResourcesScreen}
          options={{
            tabBarLabel: '자료실',
            tabBarIcon: ({ color }) => <TabBarIcon name="folder-open-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="Jobs"
          component={ParamedicJobsScreen}
          options={{
            tabBarLabel: '구인구직',
            tabBarIcon: ({ color }) => <TabBarIcon name="briefcase-outline" color={color} />,
          }}
        />
      </Tab.Navigator>
    </ParamedicCommunityProvider>
  );
}
