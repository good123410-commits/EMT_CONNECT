import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminGuard } from './components/AdminGuard';
import { ContentLayout } from './components/ContentLayout';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { DevLogPage } from './pages/about/DevLogPage';
import { HistoryPage } from './pages/about/HistoryPage';
import { StructurePage } from './pages/about/StructurePage';
import { VisionPage } from './pages/about/VisionPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { BlogListPage } from './pages/BlogListPage';
import { CommunityBoardPage } from './pages/community/CommunityBoardPage';
import { DonationPage } from './pages/community/DonationPage';
import { PollsPage } from './pages/community/PollsPage';
import { ContactPage } from './pages/download/ContactPage';
import { DownloadAppPage } from './pages/download/DownloadAppPage';
import { FaqPage } from './pages/download/FaqPage';
import { InterviewPage } from './pages/InterviewPage';
import { SchedulePage } from './pages/content/SchedulePage';
import { TrainingDetailPage } from './pages/content/TrainingDetailPage';
import { TrainingListPage } from './pages/content/TrainingListPage';
import { LandingPage } from './pages/LandingPage';
import { LegalPage } from './pages/legal/LegalPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
// import { SkillsPage } from './pages/SkillsPage';
import './styles.css';
import './dark-theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route element={<Layout />}>
            <Route index element={<LandingPage />} />

            {/* KEMIX 소개 */}
            <Route path="about/vision" element={<VisionPage />} />
            <Route path="about/history" element={<HistoryPage />} />
            <Route path="about/structure" element={<StructurePage />} />
            <Route path="about/dev-log" element={<DevLogPage />} />

            {/* KEMIX 콘텐츠 */}
            <Route path="content" element={<ContentLayout />}>
              <Route path="interview" element={<InterviewPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="training" element={<TrainingListPage />} />
              <Route path="training/:id" element={<TrainingDetailPage />} />
            </Route>

            {/* 생활 응급처치 가이드 */}
            <Route path="blog" element={<BlogListPage />} />
            <Route path="blog/:slug" element={<BlogDetailPage />} />

            {/* KEMIX 커뮤니티 */}
            <Route path="community/board" element={<CommunityBoardPage />} />
            {/* <Route path="community/skills" element={<SkillsPage />} /> */}
            <Route path="community/polls" element={<PollsPage />} />
            <Route path="community/donation" element={<DonationPage />} />

            {/* 다운로드 & Q&A */}
            <Route path="download/app" element={<DownloadAppPage />} />
            <Route path="download/faq" element={<FaqPage />} />
            <Route path="download/contact" element={<ContactPage />} />
            <Route path="download" element={<Navigate to="/download/app" replace />} />

            {/* 약관 · 정책 */}
            <Route path="legal/:slug" element={<LegalPage />} />

            {/* 관리자 */}
            <Route
              path="admin"
              element={
                <AdminGuard>
                  <AdminDashboardPage />
                </AdminGuard>
              }
            />

            {/* 레거시 리다이렉트 */}
            <Route path="interview" element={<Navigate to="/content/interview" replace />} />
            <Route path="skills" element={<Navigate to="/community/board" replace />} />
            <Route path="facilities/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
