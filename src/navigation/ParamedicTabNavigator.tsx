import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ParamedicCommunityProvider } from '@/contexts/ParamedicCommunityContext';
import { useExpertTabBarConfig } from '@/navigation/expertTabBarOptions';
import { EmsCaseStudyScreen } from '@/screens/emsCommunity/EmsCaseStudyScreen';
import { EmsChatRoomsScreen } from '@/screens/emsCommunity/EmsChatRoomsScreen';
import { EmsResourcesScreen } from '@/screens/emsCommunity/EmsResourcesScreen';
import { ParamedicJobsScreen } from '@/screens/expert/paramedic/ParamedicJobsScreen';
import { ParamedicAnswerInboxScreen } from '@/screens/questions/ParamedicAnswerInboxScreen';

export type ParamedicTabParamList = {
  AnswerInbox: undefined;
  CaseStudy: undefined;
  ChatRooms: undefined;
  Resources: undefined;
  Jobs: undefined;
};

const Tab = createBottomTabNavigator<ParamedicTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}

/**
 * EMS 커뮤니티(미래회) — 승인된 paramedic 전용 4개 서브 탭.
 * 설문/후원·공동구매 등 앱 내 결제 기능은 제외 (자료실 외부 링크만).
 */
export function ParamedicTabNavigator() {
  const { screenOptions, safeAreaInsets } = useExpertTabBarConfig({
    activeTintColor: '#4ade80',
    inactiveTintColor: '#64748b',
    backgroundColor: '#14532d',
    borderTopColor: '#14532d',
    labelFontSize: 9,
  });

  return (
    <ParamedicCommunityProvider>
      <Tab.Navigator screenOptions={screenOptions} safeAreaInsets={safeAreaInsets}>
        <Tab.Screen
          name="AnswerInbox"
          component={ParamedicAnswerInboxScreen}
          options={{
            tabBarLabel: '답변함',
            tabBarIcon: ({ color }) => <TabBarIcon name="mail-unread-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="CaseStudy"
          component={EmsCaseStudyScreen}
          options={{
            tabBarLabel: '케이스',
            tabBarIcon: ({ color }) => <TabBarIcon name="book-outline" color={color} />,
          }}
        />
        <Tab.Screen
          name="ChatRooms"
          component={EmsChatRoomsScreen}
          options={{
            tabBarLabel: '소통창',
            tabBarIcon: ({ color }) => <TabBarIcon name="chatbubbles-outline" color={color} />,
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
