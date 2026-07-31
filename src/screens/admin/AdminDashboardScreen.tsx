import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AdminAmbulancePanel } from '@/components/admin/panels/AdminAmbulancePanel';
import { AdminHospitalsPanel } from '@/components/admin/panels/AdminHospitalsPanel';
import { AdminApprovalPanel } from '@/components/admin/panels/AdminApprovalPanel';
import { AdminAuthPanel } from '@/components/admin/panels/AdminAuthPanel';
import { AdminQuestionsPanel } from '@/components/admin/panels/AdminQuestionsPanel';
import { AdminChatRoomsPanel } from '@/components/admin/panels/AdminChatRoomsPanel';
import { AdminCommunityModerationPanel } from '@/components/admin/panels/AdminCommunityModerationPanel';
import { AdminContentPanel } from '@/components/admin/panels/AdminContentPanel';
import { AdminHomeDashboardPanel } from '@/components/admin/panels/AdminHomeDashboardPanel';
import { AdminUsersPanel } from '@/components/admin/panels/AdminUsersPanel';
import { AdminDashboardGuard } from '@/components/guards/AdminDashboardGuard';
import { SettingsSubScreenHeader } from '@/components/settings/SettingsSubScreenHeader';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { fetchQuestionOverview, type QuestionOverview } from '@/services/questionService';
import type { AdminDashboardTab } from '@/types/admin';

const ALL_TABS: Array<{
  id: AdminDashboardTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  requiresDbAdmin?: boolean;
}> = [
  { id: 'approval', label: '계정 승인', icon: 'mail-outline' },
  { id: 'users', label: '유저', icon: 'people-outline', requiresDbAdmin: true },
  { id: 'auth', label: '인증/초대', icon: 'shield-checkmark-outline', requiresDbAdmin: true },
  { id: 'content', label: '콘텐츠', icon: 'document-text-outline', requiresDbAdmin: true },
  { id: 'home', label: '홈 배너', icon: 'home-outline', requiresDbAdmin: true },
  { id: 'moderation', label: '커뮤니티', icon: 'shield-outline', requiresDbAdmin: true },
  { id: 'chat', label: '채팅방', icon: 'chatbubbles-outline', requiresDbAdmin: true },
  { id: 'questions', label: 'Q&A', icon: 'help-circle-outline', requiresDbAdmin: true },
  { id: 'ambulance', label: '구급차', icon: 'bus-outline', requiresDbAdmin: true },
  { id: 'hospitals', label: '병원', icon: 'medical-outline', requiresDbAdmin: true },
];

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <View className={`flex-1 rounded-xl border px-2.5 py-2 ${tone}`}>
      <Text className="text-base font-bold text-kemix-text">{value}</Text>
      <Text className="text-[10px] font-semibold text-kemix-text-secondary">{label}</Text>
    </View>
  );
}

function RestrictedPanel({ tabLabel }: { tabLabel: string }) {
  return (
    <View className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4">
      <Text className="text-center text-sm font-semibold text-amber-900">
        {tabLabel} 기능은 승인된 DB 관리자만 사용할 수 있습니다.
      </Text>
    </View>
  );
}

function AdminDashboardContent() {
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
      case 'home':
        return <AdminHomeDashboardPanel />;
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
        className={`flex-row items-center rounded-full border px-2.5 py-1.5 ${
          active
            ? 'border-violet-700 bg-violet-700'
            : locked
              ? 'border-kemix-border bg-kemix-bg'
              : 'border-kemix-border bg-kemix-surface'
        } ${useSidebar ? 'mb-1 mr-0' : 'mr-1.5 mb-1'}`}
        onPress={() => setActiveTab(tab.id)}
      >
        <Ionicons
          name={locked ? 'lock-closed-outline' : tab.icon}
          size={13}
          color={active ? '#fff' : locked ? '#cbd5e1' : '#64748b'}
        />
        <Text
          className={`ml-1 text-[11px] font-semibold ${
            active ? 'text-white' : locked ? 'text-kemix-muted' : 'text-kemix-text-secondary'
          }`}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-kemix-bg">
      <SettingsSubScreenHeader
        title="통합 관리자 대시보드"
        subtitle={
          isDbAdmin
            ? `승인된 관리자 · ${liveProfile?.email ?? 'DB admin'}`
            : '관리자 계정 승인 후 전체 기능이 활성화됩니다'
        }
      />

      <View className="flex-row gap-1.5 px-3 pt-2">
        {overviewLoading ? (
          <View className="flex-1 items-center py-2">
            <ActivityIndicator color="#7c3aed" size="small" />
          </View>
        ) : (
          <>
            <StatTile label="Q 대기" value={overview.pending} tone="border-amber-200 bg-amber-50" />
            <StatTile label="Q 완료" value={overview.answered} tone="border-green-200 bg-green-50" />
            <StatTile label="Q 전체" value={overview.total} tone="border-kemix-border bg-kemix-surface" />
          </>
        )}
      </View>

      <View className={`flex-1 ${useSidebar ? 'flex-row px-3 pt-2' : 'pt-1.5'}`}>
        {useSidebar ? (
          <View className="mr-2 w-[108px] flex-row flex-wrap content-start">
            {visibleTabs.map(tabButton)}
          </View>
        ) : (
          <View className="px-3 pb-1">
            <View className="flex-row flex-wrap">{visibleTabs.map(tabButton)}</View>
          </View>
        )}

        <View className={`flex-1 ${useSidebar ? '' : 'px-3'}`}>
          {renderPanel()}
        </View>
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
