import { useState } from 'react';
import { PageHero } from '../../components/PageHero';
import { AdminAboutPagesPanel } from './AdminAboutPagesPanel';
import { AdminCommunityPanel } from './AdminCommunityPanel';
import { AdminDonationsPanel } from './AdminDonationsPanel';
import { AdminFaqPanel } from './AdminFaqPanel';
import { AdminGuidesPanel } from './AdminGuidesPanel';
import { AdminInterviewsPanel } from './AdminInterviewsPanel';
import { AdminNav } from './AdminNav';
import { AdminOpeningSlidesPanel } from './AdminOpeningSlidesPanel';
import { AdminSchedulesPanel } from './AdminSchedulesPanel';
import { AdminSkillsPanel } from './AdminSkillsPanel';
import { AdminSiteSettingsPanel } from './AdminSiteSettingsPanel';
import { AdminTrainingsPanel } from './AdminTrainingsPanel';
import { AdminUsersPanel } from './AdminUsersPanel';
import { findAdminGroupForTab, tabToAboutSlug, type AdminTabId } from './adminShared';

export function AdminDashboardPage() {
  const [tab, setTab] = useState<AdminTabId>('about-vision');
  const [group, setGroup] = useState(() => findAdminGroupForTab('about-vision'));
  const aboutSlug = tabToAboutSlug(tab);

  const handleGroupChange = (groupId: string, defaultTab: AdminTabId) => {
    setGroup(groupId);
    setTab(defaultTab);
  };

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
        {tab === 'opening' && <AdminOpeningSlidesPanel />}
        {tab === 'interviews' && <AdminInterviewsPanel />}
        {tab === 'schedules' && <AdminSchedulesPanel />}
        {tab === 'trainings' && <AdminTrainingsPanel />}
        {tab === 'guides' && <AdminGuidesPanel />}
        {tab === 'community' && <AdminCommunityPanel />}
        {tab === 'skills' && <AdminSkillsPanel />}
        {tab === 'donations' && <AdminDonationsPanel />}
        {tab === 'faq' && <AdminFaqPanel />}
        {tab === 'users' && <AdminUsersPanel />}
        {tab === 'site-settings' && <AdminSiteSettingsPanel />}
      </div>
    </div>
  );
}
