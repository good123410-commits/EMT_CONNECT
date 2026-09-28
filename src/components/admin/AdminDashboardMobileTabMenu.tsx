import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from 'react-native';
import type { AdminDashboardTab } from '@/types/admin';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AdminDashboardTabConfig = {
  id: AdminDashboardTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  requiresDbAdmin?: boolean;
};

type AdminDashboardMobileTabMenuProps = {
  tabs: AdminDashboardTabConfig[];
  activeTab: AdminDashboardTab;
  onSelectTab: (tab: AdminDashboardTab) => void;
  isDbAdmin: boolean;
  contentWidth: number;
};

const GRID_COLUMNS = 3;
const GRID_GAP = 8;
/** AdminDashboard `px-3` + 메뉴 펼침 영역 `px-3` */
const GRID_HORIZONTAL_INSET = 48;

function useTabGridItemWidth(contentWidth: number) {
  return useMemo(() => {
    const rowWidth = Math.max(0, contentWidth - GRID_HORIZONTAL_INSET);
    const gapTotal = GRID_GAP * (GRID_COLUMNS - 1);
    return (rowWidth - gapTotal) / GRID_COLUMNS;
  }, [contentWidth]);
}

function animateToggle() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function AdminDashboardMobileTabMenu({
  tabs,
  activeTab,
  onSelectTab,
  isDbAdmin,
  contentWidth,
}: AdminDashboardMobileTabMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const tabItemWidth = useTabGridItemWidth(contentWidth);

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab);

  const handleToggle = () => {
    animateToggle();
    setExpanded((prev) => !prev);
  };

  const handleSelectTab = (tabId: AdminDashboardTab) => {
    animateToggle();
    onSelectTab(tabId);
    setExpanded(false);
  };

  return (
    <View className="mb-2 overflow-hidden rounded-2xl border border-kemix-border bg-kemix-surface">
      <Pressable
        className="flex-row items-center px-4 py-3.5 active:bg-kemix-bg"
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel="관리자 메뉴"
        accessibilityState={{ expanded }}
      >
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color="#64748b"
        />
        <View className="ml-2 min-w-0 flex-1">
          <Text className="text-sm font-bold text-kemix-text">관리자 메뉴</Text>
          {!expanded ? (
            <Text className="mt-0.5 text-xs text-kemix-text-secondary" numberOfLines={1}>
              {activeTabMeta?.label ?? '탭 선택'}
            </Text>
          ) : (
            <Text className="mt-0.5 text-[11px] text-kemix-muted">탭을 선택하면 목록이 접힙니다</Text>
          )}
        </View>
        {!expanded && activeTabMeta ? (
          <View className="ml-2 flex-row items-center rounded-lg bg-violet-50 px-2 py-1">
            <Ionicons
              name={
                activeTabMeta.requiresDbAdmin && !isDbAdmin
                  ? 'lock-closed-outline'
                  : activeTabMeta.icon
              }
              size={14}
              color="#6d28d9"
            />
          </View>
        ) : null}
      </Pressable>

      {expanded ? (
        <View className="border-t border-kemix-border-light px-3 pb-3 pt-2">
          <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              const locked = tab.requiresDbAdmin && !isDbAdmin;

              return (
                <Pressable
                  key={tab.id}
                  style={{ width: tabItemWidth, minHeight: 64 }}
                  className={`items-center justify-center rounded-lg border px-1 py-2 ${
                    active
                      ? 'border-violet-700 bg-violet-700'
                      : locked
                        ? 'border-kemix-border bg-kemix-bg'
                        : 'border-kemix-border bg-kemix-surface'
                  }`}
                  onPress={() => handleSelectTab(tab.id)}
                >
                  <Ionicons
                    name={locked ? 'lock-closed-outline' : tab.icon}
                    size={16}
                    color={active ? '#fff' : locked ? '#cbd5e1' : '#64748b'}
                  />
                  <Text
                    className={`mt-1 px-0.5 text-center text-[10px] font-semibold leading-3 ${
                      active ? 'text-white' : locked ? 'text-kemix-muted' : 'text-kemix-text-secondary'
                    }`}
                    numberOfLines={2}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
