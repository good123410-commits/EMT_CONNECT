import { NavLink } from 'react-router-dom';
import { COMMUNITY_TABS } from '../constants/navigation';

export function CommunitySubNav() {
  return (
    <nav className="community-subnav" aria-label="커뮤니티 메뉴">
      {COMMUNITY_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `community-subnav-item${isActive ? ' community-subnav-item--active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
