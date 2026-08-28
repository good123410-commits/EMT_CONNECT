import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Alert, Text, useWindowDimensions, View } from 'react-native';
import { AdminAmbulancePanel } from '@/components/admin/panels/AdminAmbulancePanel';
import { AdminHospitalsPanel } from '@/components/admin/panels/AdminHospitalsPanel';
import { AdminApprovalPanel } from '@/components/admin/panels/AdminApprovalPanel';
import { AdminAuthPanel } from '@/components/admin/panels/AdminAuthPanel';
import { AdminChatRoomsPanel } from '@/components/admin/panels/AdminChatRoomsPanel';
import { AdminCommunityModerationPanel } from '@/components/admin/panels/AdminCommunityModerationPanel';
import { AdminContentPanel } from '@/components/admin/panels/AdminContentPanel';
import { AdminDonationPanel } from '@/components/admin/panels/AdminDonationPanel';
import { AdminShortcodesPanel } from '@/components/admin/panels/AdminShortcodesPanel';
import { AdminHomeDashboardPanel } from '@/components/admin/panels/AdminHomeDashboardPanel';
import { AdminUsersPanel } from '@/components/admin/panels/AdminUsersPanel';
import { AdminDashboardGuard } from '@/components/guards/AdminDashboardGuard';
import { SettingsSubScreenHeader } from '@/components/settings/SettingsSubScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useAppHeader } from '@/hooks/useAppHeader';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import { navigationRef } from '@/navigation/navigationRef';
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
  { id: 'ambulance', label: '구급차', icon: 'bus-outline', requiresDbAdmin: true },
  { id: 'hospitals', label: '병원', icon: 'medical-outline', requiresDbAdmin: true },
  { id: 'donations', label: '후원 계좌', icon: 'cafe-outline', requiresDbAdmin: true },
  { id: 'shortcodes', label: '숏코드', icon: 'code-slash-outline', requiresDbAdmin: true },
];

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
  const { signOut } = useAuth();
  useAppHeader({
    title: '통합 관리자 대시보드',
    showBack: true,
    onBack: () => {
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
      }
    },
  });
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('approval');

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const visibleTabs = useMemo(() => ALL_TABS, []);
  const mobileTabWidth = useMemo(() => (width - 24 - 12) / 3, [width]);

  useEffect(() => {
    if (isDbAdmin) {
      setActiveTab((prev) => (prev === 'approval' ? 'users' : prev));
    } else {
      setActiveTab('approval');
    }
  }, [isDbAdmin]);

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
      case 'ambulance':
        return <AdminAmbulancePanel />;
      case 'hospitals':
        return <AdminHospitalsPanel />;
      case 'donations':
        return <AdminDonationPanel />;
      case 'shortcodes':
        return <AdminShortcodesPanel />;
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
        style={useSidebar ? undefined : { width: mobileTabWidth }}
        className={`flex-row items-center rounded-xl border px-2 py-2 ${
          active
            ? 'border-violet-700 bg-violet-700'
            : locked
              ? 'border-kemix-border bg-kemix-bg'
              : 'border-kemix-border bg-kemix-surface'
        } ${useSidebar ? 'mb-1.5 mr-0' : 'mb-1.5 justify-center'}`}
        onPress={() => setActiveTab(tab.id)}
      >
        <Ionicons
          name={locked ? 'lock-closed-outline' : tab.icon}
          size={14}
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
        subtitle={
          isDbAdmin
            ? `승인된 관리자 · ${liveProfile?.email ?? 'DB admin'}`
            : '관리자 계정 승인 후 전체 기능이 활성화됩니다'
        }
      />

      <View className={`flex-1 ${useSidebar ? 'flex-row px-3 pt-3' : 'pt-2'}`}>
        {useSidebar ? (
          <View className="mr-3 w-[120px]">
            {visibleTabs.map(tabButton)}
          </View>
        ) : (
          <View className="px-3 pb-2">
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {visibleTabs.map(tabButton)}
            </View>
          </View>
        )}

        <View className={`flex-1 ${useSidebar ? '' : 'px-3'}`}>
          {renderPanel()}
        </View>
      </View>

      <View className="border-t border-kemix-border bg-kemix-surface px-4 py-3">
        <Pressable
          className="flex-row items-center justify-center rounded-xl border border-kemix-border py-3 active:bg-kemix-bg"
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color="#64748b" />
          <Text className="ml-2 text-sm font-semibold text-kemix-text-secondary">로그아웃</Text>
        </Pressable>
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
