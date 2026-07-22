import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { BlogListPage } from './pages/BlogListPage';
import { LandingPage } from './pages/LandingPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { AdminPage } from './pages/AdminPage';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="blog" element={<BlogListPage />} />
          <Route path="blog/:slug" element={<BlogDetailPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
