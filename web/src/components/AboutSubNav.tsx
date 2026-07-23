import { NavLink } from 'react-router-dom';
import { ABOUT_TABS } from '../constants/navigation';

export function AboutSubNav() {
  return (
    <nav className="community-subnav about-subnav" aria-label="KEMIX 소개 메뉴">
      {ABOUT_TABS.map((tab) => (
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
