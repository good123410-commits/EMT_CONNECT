import { NavLink } from 'react-router-dom';
import { DOWNLOAD_TABS } from '../constants/navigation';

export function DownloadSubNav() {
  return (
    <nav className="community-subnav download-subnav" aria-label="자료실 & 질문하기 메뉴">
      {DOWNLOAD_TABS.map((tab) => (
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
