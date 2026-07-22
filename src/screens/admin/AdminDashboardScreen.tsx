import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AdminAmbulancePanel } from '@/components/admin/panels/AdminAmbulancePanel';
import { AdminBlogPanel } from '@/components/admin/panels/AdminBlogPanel';
import { AdminHospitalsPanel } from '@/components/admin/panels/AdminHospitalsPanel';
import { AdminApprovalPanel } from '@/components/admin/panels/AdminApprovalPanel';
import { AdminAuthPanel } from '@/components/admin/panels/AdminAuthPanel';
import { AdminQuestionsPanel } from '@/components/admin/panels/AdminQuestionsPanel';
import { AdminChatRoomsPanel } from '@/components/admin/panels/AdminChatRoomsPanel';
import { AdminCommunityModerationPanel } from '@/components/admin/panels/AdminCommunityModerationPanel';
import { AdminContentPanel } from '@/components/admin/panels/AdminContentPanel';
import { AdminUsersPanel } from '@/components/admin/panels/AdminUsersPanel';
import { AdminDashboardGuard } from '@/components/guards/AdminDashboardGuard';
import { SettingsSubScreenHeader } from '@/components/settings/SettingsSubScreenHeader';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import type { SettingsStackParamList } from '@/navigation/SettingsStackNavigator';
import { fetchQuestionOverview, type QuestionOverview } from '@/services/questionService';
import type { AdminDashboardTab } from '@/types/admin';

const ALL_TABS: Array<{
  id: AdminDashboardTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  requiresDbAdmin?: boolean;
}> = [
  { id: 'approval', label: '계정 승인', icon: 'mail-outline' },
  { id: 'users', label: '유저 관리', icon: 'people-outline', requiresDbAdmin: true },
  { id: 'auth', label: '인증/초대', icon: 'shield-checkmark-outline', requiresDbAdmin: true },
  { id: 'content', label: '콘텐츠', icon: 'document-text-outline', requiresDbAdmin: true },
  { id: 'moderation', label: '커뮤니티', icon: 'shield-outline', requiresDbAdmin: true },
  { id: 'chat', label: '채팅방', icon: 'chatbubbles-outline', requiresDbAdmin: true },
  { id: 'questions', label: '일반인 Q&A', icon: 'help-circle-outline', requiresDbAdmin: true },
  { id: 'ambulance', label: '구급차', icon: 'bus-outline', requiresDbAdmin: true },
  { id: 'hospitals', label: '병원 데이터', icon: 'medical-outline', requiresDbAdmin: true },
  { id: 'blog', label: '응급 가이드', icon: 'newspaper-outline', requiresDbAdmin: true },
];

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <View className={`flex-1 rounded-2xl border p-3 ${tone}`}>
      <Text className="text-xl font-bold text-slate-900">{value}</Text>
      <Text className="mt-0.5 text-[10px] font-semibold text-slate-600">{label}</Text>
    </View>
  );
}

function RestrictedPanel({ tabLabel }: { tabLabel: string }) {
  return (
    <View className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-6">
      <Text className="text-center text-sm font-semibold text-amber-900">
        {tabLabel} 기능은 승인된 DB 관리자만 사용할 수 있습니다.
      </Text>
      <Text className="mt-2 text-center text-xs leading-5 text-amber-800">
        상단 [계정 승인] 탭에서 로그인 이메일로 승인 요청을 완료해 주세요.
      </Text>
    </View>
  );
}

function AdminDashboardContent() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { width } = useWindowDimensions();
  const useSidebar = width >= 768;
  const { isDbAdmin, reload, liveProfile } = useLiveDbAdmin();
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('approval');
  const [overview, setOverview] = useState<QuestionOverview>({ pending: 0, answered: 0, total: 0 });
  const [overviewLoading, setOverviewLoading] = useState(true);

  const visibleTabs = useMemo(() => ALL_TABS, []);

  useEffect(() => {
    if (isDbAdmin) {
      setActiveTab((prev) => (prev === 'approval' ? 'users' : prev));
    } else {
      setActiveTab('approval');
    }
  }, [isDbAdmin]);

  useEffect(() => {
    setOverviewLoading(true);
    void fetchQuestionOverview()
      .then(setOverview)
      .finally(() => setOverviewLoading(false));
  }, []);

  const renderPanel = () => {
    const current = ALL_TABS.find((tab) => tab.id === activeTab);
    if (current?.requiresDbAdmin && !isDbAdmin) {
      return <RestrictedPanel tabLabel={current.label} />;
    }

    switch (activeTab) {
      case 'approval':
        return <AdminApprovalPanel onApproved={() => void reload()} />;
      case 'users':
        return <AdminUsersPanel />;
      case 'auth':
        return <AdminAuthPanel />;
      case 'content':
        return <AdminContentPanel />;
      case 'moderation':
        return <AdminCommunityModerationPanel />;
      case 'chat':
        return <AdminChatRoomsPanel />;
      case 'questions':
        return <AdminQuestionsPanel />;
      case 'ambulance':
        return <AdminAmbulancePanel />;
      case 'hospitals':
        return <AdminHospitalsPanel />;
      case 'blog':
        return <AdminBlogPanel />;
      default:
        return null;
    }
  };

  const tabButton = (tab: (typeof ALL_TABS)[number]) => {
    const active = activeTab === tab.id;
    const locked = tab.requiresDbAdmin && !isDbAdmin;

    return (
      <Pressable
        key={tab.id}
        className={`flex-row items-center rounded-xl px-3 py-2.5 ${
          active ? 'bg-violet-700' : locked ? 'bg-slate-50' : 'bg-white'
        } ${useSidebar ? 'mb-1.5' : 'mr-2'}`}
        onPress={() => setActiveTab(tab.id)}
      >
        <Ionicons
          name={locked ? 'lock-closed-outline' : tab.icon}
          size={16}
          color={active ? '#fff' : locked ? '#cbd5e1' : '#64748b'}
        />
        <Text
          className={`ml-2 text-sm font-semibold ${
            active ? 'text-white' : locked ? 'text-slate-400' : 'text-slate-600'
          } ${useSidebar ? '' : 'pr-1'}`}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SettingsSubScreenHeader
        title="통합 관리자 대시보드"
        subtitle={
          isDbAdmin
            ? `승인된 관리자 · ${liveProfile?.email ?? 'DB admin'}`
            : '관리자 계정 승인 후 전체 기능이 활성화됩니다'
        }
      />

      <View className="flex-row gap-2 px-4 pt-3">
        {overviewLoading ? (
          <View className="flex-1 items-center py-4">
            <ActivityIndicator color="#7c3aed" size="small" />
          </View>
        ) : (
          <>
            <StatTile label="Q 대기" value={overview.pending} tone="border-amber-200 bg-amber-50" />
            <StatTile label="Q 완료" value={overview.answered} tone="border-green-200 bg-green-50" />
            <StatTile label="Q 전체" value={overview.total} tone="border-slate-200 bg-white" />
          </>
        )}
      </View>

      <Pressable
        className="mx-4 mt-3 flex-row items-center justify-between rounded-2xl border border-green-200 bg-green-700 px-4 py-3 active:bg-green-800"
        onPress={() => navigation.navigate('ParamedicAnswerInbox')}
      >
        <Text className="font-bold text-white">전문가 답변함</Text>
        <Ionicons name="chevron-forward" size={18} color="#bbf7d0" />
      </Pressable>

      <View className={`flex-1 ${useSidebar ? 'flex-row px-4 pt-4' : 'pt-3'}`}>
        {useSidebar ? (
          <View className="mr-3 w-44">{visibleTabs.map(tabButton)}</View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 pb-2"
          >
            {visibleTabs.map(tabButton)}
          </ScrollView>
        )}

        <View className={`flex-1 ${useSidebar ? '' : 'px-4 pt-2'}`}>{renderPanel()}</View>
      </View>
    </View>
  );
}

export function AdminDashboardScreen() {
  return (
    <AdminDashboardGuard>
      <AdminDashboardContent />
    </AdminDashboardGuard>
  );
}
