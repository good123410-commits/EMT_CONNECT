import { useState } from 'react';
import type { AboutPageSlug } from '../../types';

export type AdminTabId =
  | 'about-vision'
  | 'about-history'
  | 'about-structure'
  | 'about-dev-log'
  | 'opening'
  | 'interviews'
  | 'schedules'
  | 'trainings'
  | 'guides'
  | 'community'
  | 'polls'
  | 'skills'
  | 'donations'
  | 'fund-usage'
  | 'resources'
  | 'app-download'
  | 'faq'
  | 'users'
  | 'site-settings';

export type AdminNavGroup = {
  id: string;
  label: string;
  children?: { id: AdminTabId; label: string }[];
  tabId?: AdminTabId;
};

/** 상단 GNB와 동일한 관리자 메뉴 구조 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'about',
    label: 'KEMIX 소개',
    children: [
      { id: 'about-vision', label: '케믹스 비전' },
      { id: 'about-history', label: '케믹스 연혁' },
      { id: 'about-structure', label: '케믹스 구성' },
      { id: 'about-dev-log', label: '개발일지' },
      { id: 'opening', label: '오프닝 & 슬라이드' },
    ],
  },
  {
    id: 'content',
    label: 'KEMIX 콘텐츠',
    children: [
      { id: 'interviews', label: '이달의 인터뷰' },
      { id: 'schedules', label: 'KEMIX 일정' },
      { id: 'trainings', label: 'KEMIX 교육 안내' },
    ],
  },
  {
    id: 'guides',
    label: '생활 응급처치 가이드',
    tabId: 'guides',
  },
  {
    id: 'community',
    label: 'KEMIX 커뮤니티',
    children: [
      { id: 'community', label: '자유게시판' },
      // { id: 'skills', label: '스킬 테크 트리' },
      { id: 'polls', label: 'KEMIX 투표' },
      { id: 'donations', label: '모금 계좌' },
      { id: 'fund-usage', label: '기금 사용 안내' },
    ],
  },
  {
    id: 'support',
    label: '자료실 & 질문하기',
    children: [
      { id: 'resources', label: '자료실 관리' },
      { id: 'app-download', label: '앱 다운로드 관리' },
      { id: 'faq', label: '자주하는 질문(FAQ)' },
    ],
  },
  {
    id: 'system',
    label: '시스템',
    children: [
      { id: 'users', label: '유저 관리' },
      { id: 'site-settings', label: '사이트 설정' },
    ],
  },
];

export function findAdminGroupForTab(tabId: AdminTabId): string {
  for (const group of ADMIN_NAV) {
    if (group.tabId === tabId) return group.id;
    if (group.children?.some((c) => c.id === tabId)) return group.id;
  }
  return ADMIN_NAV[0].id;
}

export function getAdminSubTabs(groupId: string) {
  const group = ADMIN_NAV.find((g) => g.id === groupId);
  return group?.children ?? null;
}

export function tabToAboutSlug(tab: AdminTabId): AboutPageSlug | null {
  const map: Partial<Record<AdminTabId, AboutPageSlug>> = {
    'about-vision': 'vision',
  };
  return map[tab] ?? null;
}

export function tabToAboutItemSlug(tab: AdminTabId): import('../../types').AboutItemPageSlug | null {
  const map: Partial<Record<AdminTabId, import('../../types').AboutItemPageSlug>> = {
    'about-history': 'history',
    'about-structure': 'structure',
    'about-dev-log': 'dev-log',
  };
  return map[tab] ?? null;
}

export function useAdminForm<T extends object>(empty: T) {
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reset = () => {
    setEditingId(null);
    setForm(empty);
  };

  const startEdit = (id: string, values: T) => {
    setEditingId(id);
    setForm(values);
  };

  return { form, setForm, editingId, reset, startEdit };
}
