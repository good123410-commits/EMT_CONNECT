import {
  ADMIN_NAV,
  findAdminGroupForTab,
  getAdminSubTabs,
  type AdminTabId,
} from './adminShared';

type AdminNavProps = {
  activeTab: AdminTabId;
  activeGroup: string;
  onGroupChange: (groupId: string, defaultTab: AdminTabId) => void;
  onTabChange: (tabId: AdminTabId) => void;
};

export function AdminNav({ activeTab, activeGroup, onGroupChange, onTabChange }: AdminNavProps) {
  const subTabs = getAdminSubTabs(activeGroup);

  return (
    <div className="admin-nav-stack">
      <nav className="admin-nav admin-nav--groups" aria-label="관리자 메뉴">
        {ADMIN_NAV.map((group) => {
          const isActive = group.id === activeGroup;
          const defaultTab = group.tabId ?? group.children?.[0]?.id;
          if (!defaultTab) return null;

          return (
            <button
              key={group.id}
              type="button"
              className={`admin-nav-group${isActive ? ' admin-nav-group--active' : ''}`}
              onClick={() => onGroupChange(group.id, defaultTab)}
            >
              {group.label}
            </button>
          );
        })}
      </nav>

      {subTabs && subTabs.length > 1 ? (
        <nav className="community-subnav admin-nav--sub" aria-label="하위 메뉴">
          {subTabs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              className={`community-subnav-item${activeTab === sub.id ? ' community-subnav-item--active' : ''}`}
              onClick={() => onTabChange(sub.id)}
            >
              {sub.label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export function resolveAdminGroup(tab: AdminTabId): string {
  return findAdminGroupForTab(tab);
}
