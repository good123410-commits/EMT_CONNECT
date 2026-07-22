import { NavLink, Outlet } from 'react-router-dom';
import { PageHero } from './PageHero';
import { CONTENT_TABS } from '../constants/navigation';

export function ContentSubNav() {
  return (
    <nav className="community-subnav content-subnav" aria-label="KEMIX 콘텐츠 메뉴">
      {CONTENT_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `community-subnav-item${isActive ? ' community-subnav-item--active' : ''}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function ContentLayout() {
  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX Content"
        title="KEMIX 콘텐츠"
        subtitle="인터뷰, 일정, 교육 안내를 한곳에서 확인하세요"
        dark
      />
      <ContentSubNav />
      <Outlet />
    </div>
  );
}
