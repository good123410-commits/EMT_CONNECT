import { useState } from 'react';
import { PageHero } from '../../components/PageHero';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { AdminAppDownloadPanel } from './AdminAppDownloadPanel';
import { AdminResourcesPanel } from './AdminResourcesPanel';
import { AdminAboutPagesPanel } from './AdminAboutPagesPanel';
import { AdminAboutItemsPanel } from './AdminAboutItemsPanel';
import { AdminCommunityPanel } from './AdminCommunityPanel';
import { AdminDonationsPanel } from './AdminDonationsPanel';
import { AdminFundUsagePanel } from './AdminFundUsagePanel';
import { AdminFaqPanel } from './AdminFaqPanel';
import { AdminInquiriesPanel } from './AdminInquiriesPanel';
import { AdminGuidesPanel } from './AdminGuidesPanel';
import { AdminInterviewsPanel } from './AdminInterviewsPanel';
import { AdminNav } from './AdminNav';
import { AdminOpeningSlidesPanel } from './AdminOpeningSlidesPanel';
import { AdminSchedulesPanel } from './AdminSchedulesPanel';
import { AdminPollsPanel } from './AdminPollsPanel';
import { AdminSiteSettingsPanel } from './AdminSiteSettingsPanel';
import { AdminTrainingsPanel } from './AdminTrainingsPanel';
import { AdminUsersPanel } from './AdminUsersPanel';
import { findAdminGroupForTab, tabToAboutItemSlug, tabToAboutSlug, type AdminTabId } from './adminShared';

export function AdminDashboardPage() {
  const [tab, setTab] = useState<AdminTabId>('about-vision');
  const [group, setGroup] = useState(() => findAdminGroupForTab('about-vision'));
  const aboutSlug = tabToAboutSlug(tab);
  const aboutItemSlug = tabToAboutItemSlug(tab);

  const handleGroupChange = (groupId: string, defaultTab: AdminTabId) => {
    setGroup(groupId);
    setTab(defaultTab);
  };

  useScrollToTop([tab, group]);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="Admin"
        title="KEMIX 관리자 대시보드"
        subtitle="웹·앱 공유 Supabase DB 실시간 콘텐츠 관리"
        dark
      />
      <div className="admin-dashboard">
        <AdminNav
          activeTab={tab}
          activeGroup={group}
          onGroupChange={handleGroupChange}
          onTabChange={setTab}
        />

        {aboutSlug ? <AdminAboutPagesPanel slug={aboutSlug} /> : null}
        {aboutItemSlug ? <AdminAboutItemsPanel pageSlug={aboutItemSlug} /> : null}
        {tab === 'opening' && <AdminOpeningSlidesPanel />}
        {tab === 'interviews' && <AdminInterviewsPanel />}
        {tab === 'schedules' && <AdminSchedulesPanel />}
        {tab === 'trainings' && <AdminTrainingsPanel />}
        {tab === 'guides' && <AdminGuidesPanel />}
        {tab === 'community' && <AdminCommunityPanel />}
        {/* {tab === 'skills' && <AdminSkillsPanel />} */}
        {tab === 'polls' && <AdminPollsPanel />}
        {tab === 'donations' && <AdminDonationsPanel />}
        {tab === 'fund-usage' && <AdminFundUsagePanel />}
        {tab === 'resources' && <AdminResourcesPanel />}
        {tab === 'app-download' && <AdminAppDownloadPanel />}
        {tab === 'faq' && <AdminFaqPanel />}
        {tab === 'inquiries' && <AdminInquiriesPanel />}
        {tab === 'users' && <AdminUsersPanel />}
        {tab === 'site-settings' && <AdminSiteSettingsPanel />}
      </div>
    </div>
  );
}
