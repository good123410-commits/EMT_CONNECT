import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  AdminEmergencyNoticeFormModal,
  type EmergencyNoticeFormValues,
} from '@/components/admin/panels/AdminEmergencyNoticeFormModal';
import { AdminEmergencyTickerItemEditModal } from '@/components/admin/panels/AdminEmergencyTickerItemEditModal';
import { subscribeHomeEmergencyNotices } from '@/lib/realtimeSubscription';
import {
  deleteHomeEmergencyNotice,
  fetchAllHomeEmergencyNotices,
  upsertHomeEmergencyNotice,
} from '@/services/homeEmergencyNoticeService';
import {
  fetchEmergencyTickerDashboardItems,
  hideEmergencyTickerCacheItem,
  reorderEmergencyTickerItems,
  toggleEmergencyTickerDashboardItem,
  updateEmergencyTickerCacheMessage,
} from '@/services/emergencyTickerAdminService';
import type { EmergencyTickerDashboardItem, HomeEmergencyNotice } from '@/types/emergencyTicker';
import { EMERGENCY_TICKER_SOURCE_LABELS } from '@/types/emergencyTicker';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';
import {
  classifyTickerDashboardItem,
  countItemsForRegionFilter,
  groupDashboardItemsByRegion,
  itemMatchesRegionFilter,
  mergeRegionalReorder,
  sidoAdminChipLabel,
  TICKER_ADMIN_REGION_FILTERS,
  TICKER_REGION_COMMON,
  TICKER_REGION_NATIONWIDE,
  type TickerRegionGroup,
} from '@/utils/emergencyTickerAdminRegion';
import { withStopPropagation } from '@/utils/pressEvent';

const SOURCE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#f1f5f9', text: '#0f172a' },
  weather: { bg: '#dbeafe', text: '#1d4ed8' },
  forest_fire: { bg: '#fee2e2', text: '#b91c1c' },
  disaster_sms: { bg: '#fef9c3', text: '#a16207' },
};

function sourceLabel(sourceType: string): string {
  return EMERGENCY_TICKER_SOURCE_LABELS[sourceType] ?? sourceType;
}

function badgeColors(sourceType: string) {
  return SOURCE_BADGE_COLORS[sourceType] ?? { bg: '#f1f5f9', text: '#334155' };
}

function toReorderPayload(items: EmergencyTickerDashboardItem[]) {
  return items.map((item, index) => ({
    itemKey: item.itemKey,
    sourceType: item.sourceType,
    originalMessage: item.originalMessage,
    sortOrder: index * 10,
    adminNoticeId: item.adminNoticeId,
    cacheSourceCode: item.cacheSourceCode,
  }));
}

function regionTagsForItem(item: EmergencyTickerDashboardItem): string[] {
  return classifyTickerDashboardItem(item).map((regionKey) => sidoAdminChipLabel(regionKey));
}

type AdminEmergencyTickerPanelProps = {
  onCreateNotice: () => void;
};

type TickerItemCardProps = {
  item: EmergencyTickerDashboardItem;
  index: number;
  total: number;
  reordering: boolean;
  showRegionTags: boolean;
  onToggleActive: (item: EmergencyTickerDashboardItem, isActive: boolean) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (item: EmergencyTickerDashboardItem) => void;
  onDelete: (item: EmergencyTickerDashboardItem) => void;
};

function TickerItemCard({
  item,
  index,
  total,
  reordering,
  showRegionTags,
  onToggleActive,
  onMove,
  onEdit,
  onDelete,
}: TickerItemCardProps) {
  const colors = badgeColors(item.sourceType);
  const regionTags = regionTagsForItem(item);

  return (
    <View
      className="mb-3 rounded-2xl border border-kemix-border bg-kemix-surface p-3"
      style={{ opacity: item.isActive ? 1 : 0.55 }}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <View className="mb-2 flex-row flex-wrap items-center gap-2">
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.bg }}>
              <Text className="text-[10px] font-bold" style={{ color: colors.text }}>
                {sourceLabel(item.sourceType)}
              </Text>
            </View>
            {showRegionTags
              ? regionTags.map((tag) => (
                  <View key={`${item.itemKey}-${tag}`} className="rounded-full bg-slate-100 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold text-slate-600">{tag}</Text>
                  </View>
                ))
              : null}
            {item.cacheIsExpired ? (
              <Text className="text-[10px] font-semibold text-amber-600">캐시 만료</Text>
            ) : null}
            {!item.isActive ? (
              <Text className="text-[10px] font-semibold text-slate-500">숨김</Text>
            ) : null}
          </View>
          <Text className="text-sm font-semibold text-kemix-text" numberOfLines={4}>
            {item.displayMessage || '내용 없음'}
          </Text>
          {item.originalMessage !== item.displayMessage ? (
            <Text className="mt-1 text-[11px] text-kemix-text-secondary" numberOfLines={2}>
              원문: {item.originalMessage}
            </Text>
          ) : null}
          {item.cacheFetchedAt ? (
            <Text className="mt-1 text-[10px] text-kemix-text-secondary">
              API 수집: {new Date(item.cacheFetchedAt).toLocaleString('ko-KR')}
            </Text>
          ) : null}
        </View>
        <Switch value={item.isActive} onValueChange={(value) => onToggleActive(item, value)} />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row gap-1">
          <Pressable
            accessibilityLabel="위로 이동"
            className="rounded-lg bg-kemix-elevated px-2.5 py-1.5"
            disabled={index === 0 || reordering}
            onPress={withStopPropagation(() => onMove(index, -1))}
            style={{ opacity: index === 0 || reordering ? 0.4 : 1 }}
          >
            <Ionicons name="chevron-up" size={16} color="#334155" />
          </Pressable>
          <Pressable
            accessibilityLabel="아래로 이동"
            className="rounded-lg bg-kemix-elevated px-2.5 py-1.5"
            disabled={index === total - 1 || reordering}
            onPress={withStopPropagation(() => onMove(index, 1))}
            style={{ opacity: index === total - 1 || reordering ? 0.4 : 1 }}
          >
            <Ionicons name="chevron-down" size={16} color="#334155" />
          </Pressable>
          <Text className="self-center px-1 text-[10px] text-kemix-text-secondary">
            {index + 1}/{total}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            className="rounded-lg bg-kemix-elevated px-3 py-1.5"
            onPress={withStopPropagation(() => onEdit(item))}
          >
            <Text className="text-[11px] font-semibold text-kemix-text">수정</Text>
          </Pressable>
          <Pressable
            className="rounded-lg bg-red-50 px-3 py-1.5"
            onPress={withStopPropagation(() => onDelete(item))}
          >
            <Text className="text-[11px] font-semibold text-red-600">삭제</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function AdminEmergencyTickerPanel({ onCreateNotice }: AdminEmergencyTickerPanelProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EmergencyTickerDashboardItem[]>([]);
  const [reordering, setReordering] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [cacheEditItem, setCacheEditItem] = useState<EmergencyTickerDashboardItem | null>(null);
  const [noticeEditItem, setNoticeEditItem] = useState<HomeEmergencyNotice | null>(null);
  const [noticeFormVisible, setNoticeFormVisible] = useState(false);

  const reload = useCallback(async () => {
    try {
      const rows = await fetchEmergencyTickerDashboardItems();
      setItems(rows);
    } catch (error) {
      Alert.alert(
        '조회 실패',
        error instanceof Error ? error.message : '전광판 목록을 불러올 수 없습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeHomeEmergencyNotices(() => {
      void reload();
    });
    return unsubscribe;
  }, [reload]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { '': items.length };
    for (const regionKey of TICKER_ADMIN_REGION_FILTERS) {
      counts[regionKey] = countItemsForRegionFilter(items, regionKey);
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(
    () => items.filter((item) => itemMatchesRegionFilter(item, selectedRegion)),
    [items, selectedRegion],
  );

  const groupedItems = useMemo(() => groupDashboardItemsByRegion(items), [items]);

  const persistReorder = async (nextItems: EmergencyTickerDashboardItem[]) => {
    setReordering(true);
    setItems(nextItems);
    try {
      await reorderEmergencyTickerItems(toReorderPayload(nextItems));
      await Promise.all(
        nextItems.map((item, index) => {
          if (item.sourceType !== 'admin' || !item.adminNoticeId) {
            return Promise.resolve();
          }
          return upsertHomeEmergencyNotice({
            id: item.adminNoticeId,
            message: item.displayMessage,
            isActive: item.isActive,
            sortOrder: index * 10,
          });
        }),
      );
    } catch (error) {
      await reload();
      Alert.alert(
        '순서 저장 실패',
        error instanceof Error ? error.message : '송출 순서를 저장하지 못했습니다.',
      );
    } finally {
      setReordering(false);
    }
  };

  const moveItemsInRegion = (regionKey: string, index: number, direction: -1 | 1) => {
    const isVisible = (item: EmergencyTickerDashboardItem) =>
      itemMatchesRegionFilter(item, regionKey);
    const visible = items.filter(isVisible);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= visible.length) return;

    const nextVisible = [...visible];
    const [moved] = nextVisible.splice(index, 1);
    nextVisible.splice(targetIndex, 0, moved);

    const nextAll = mergeRegionalReorder(items, isVisible, nextVisible);
    void persistReorder(nextAll);
  };

  const handleToggleActive = async (item: EmergencyTickerDashboardItem, isActive: boolean) => {
    try {
      await toggleEmergencyTickerDashboardItem(item, isActive);
      setItems((prev) =>
        prev.map((row) => (row.itemKey === item.itemKey ? { ...row, isActive } : row)),
      );
    } catch (error) {
      Alert.alert(
        '변경 실패',
        error instanceof Error ? error.message : '노출 상태를 변경하지 못했습니다.',
      );
    }
  };

  const openEdit = async (item: EmergencyTickerDashboardItem) => {
    if (item.sourceType === 'admin' && item.adminNoticeId) {
      try {
        const notices = await fetchAllHomeEmergencyNotices();
        const notice = notices.find((row) => row.id === item.adminNoticeId) ?? null;
        setNoticeEditItem(notice);
        setNoticeFormVisible(true);
      } catch {
        Alert.alert('조회 실패', '안내 문구를 불러올 수 없습니다.');
      }
      return;
    }
    setCacheEditItem(item);
  };

  const handleNoticeSubmit = async (values: EmergencyNoticeFormValues) => {
    const nextSort =
      noticeEditItem?.sortOrder ??
      items.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 10;

    await upsertHomeEmergencyNotice({
      id: noticeEditItem?.id,
      message: values.message,
      isActive: values.isActive,
      sortOrder: nextSort,
    });
    await reload();
    Alert.alert('저장 완료', '전광판에 즉시 반영됩니다.');
  };

  const handleCacheEditSubmit = async (message: string) => {
    if (!cacheEditItem) return;
    await updateEmergencyTickerCacheMessage(cacheEditItem, message);
    await reload();
    Alert.alert('저장 완료', '전광판 문구가 수정되었습니다.');
  };

  const handleDelete = (item: EmergencyTickerDashboardItem) => {
    const label = sourceLabel(item.sourceType);
    confirmDestructiveAction(
      '전광판 항목 삭제',
      `[${label}] 항목을 삭제(숨김)하시겠습니까?`,
      async () => {
        try {
          if (item.sourceType === 'admin' && item.adminNoticeId) {
            await deleteHomeEmergencyNotice(item.adminNoticeId);
          } else {
            await hideEmergencyTickerCacheItem(item);
          }
          await reload();
        } catch (error) {
          Alert.alert(
            '삭제 실패',
            error instanceof Error ? error.message : '항목을 삭제하지 못했습니다.',
          );
        }
      },
    );
  };

  const renderItemList = (
    listItems: EmergencyTickerDashboardItem[],
    regionKey: string,
    showRegionTags: boolean,
  ) =>
    listItems.map((item, index) => (
      <TickerItemCard
        key={item.itemKey}
        item={item}
        index={index}
        total={listItems.length}
        reordering={reordering}
        showRegionTags={showRegionTags}
        onToggleActive={(row, value) => void handleToggleActive(row, value)}
        onMove={(itemIndex, direction) => moveItemsInRegion(regionKey, itemIndex, direction)}
        onEdit={(row) => void openEdit(row)}
        onDelete={handleDelete}
      />
    ));

  const renderGroupedSections = (groups: TickerRegionGroup[]) =>
    groups.map((group) => (
      <View key={group.regionKey} className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-bold text-kemix-text">{group.label}</Text>
          <Text className="text-[10px] text-kemix-text-secondary">{group.items.length}건</Text>
        </View>
        {renderItemList(group.items, group.regionKey, false)}
      </View>
    ));

  if (loading) {
    return (
      <View className="mb-6 items-center py-8">
        <ActivityIndicator color="#dc2626" />
        <Text className="mt-2 text-xs text-kemix-text-secondary">전광판 목록 불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-bold text-kemix-text">전광판 송출 관리</Text>
          <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">
            시·도별로 홈 전광판에 노출되는 항목을 확인하고, 지역 단위로 순서·문구·노출을 관리할 수
            있습니다.
          </Text>
        </View>
        <Pressable
          className="flex-row items-center rounded-xl bg-red-600 px-3 py-2 active:bg-red-700"
          onPress={onCreateNotice}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="ml-1 text-xs font-bold text-white">안내 추가</Text>
        </Pressable>
      </View>

      <Text className="mb-1 text-xs font-semibold text-kemix-text-secondary">시·도별 보기</Text>
      <RegionFilterScroller>
        <FilterChip
          label={`전체 (${regionCounts[''] ?? 0})`}
          active={!selectedRegion}
          onPress={() => setSelectedRegion('')}
        />
        <FilterChip
          label={`공통 (${regionCounts[TICKER_REGION_COMMON] ?? 0})`}
          active={selectedRegion === TICKER_REGION_COMMON}
          onPress={() => setSelectedRegion(TICKER_REGION_COMMON)}
        />
        <FilterChip
          label={`전국 (${regionCounts[TICKER_REGION_NATIONWIDE] ?? 0})`}
          active={selectedRegion === TICKER_REGION_NATIONWIDE}
          onPress={() => setSelectedRegion(TICKER_REGION_NATIONWIDE)}
        />
        {TICKER_ADMIN_REGION_FILTERS.filter(
          (key) => key !== TICKER_REGION_COMMON && key !== TICKER_REGION_NATIONWIDE,
        ).map((regionKey) => (
          <FilterChip
            key={regionKey}
            label={`${sidoAdminChipLabel(regionKey)} (${regionCounts[regionKey] ?? 0})`}
            active={selectedRegion === regionKey}
            onPress={() => setSelectedRegion(regionKey)}
          />
        ))}
      </RegionFilterScroller>

      {selectedRegion ? (
        <Text className="mb-2 mt-1 text-[11px] leading-5 text-kemix-text-secondary">
          {sidoAdminChipLabel(selectedRegion)} 지역 사용자 화면 기준 · {filteredItems.length}건 표시
          {selectedRegion !== TICKER_REGION_COMMON && selectedRegion !== TICKER_REGION_NATIONWIDE
            ? ' (공통 안내·전국 알림 포함)'
            : ''}
        </Text>
      ) : (
        <Text className="mb-2 mt-1 text-[11px] leading-5 text-kemix-text-secondary">
          전체 보기에서는 시·도별로 묶어 표시됩니다. 특정 지역을 선택하면 해당 지역 송출 목록만
          관리할 수 있습니다.
        </Text>
      )}

      {reordering ? (
        <Text className="mb-2 text-[11px] text-kemix-text-secondary">송출 순서 저장 중…</Text>
      ) : null}

      {items.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-red-200 bg-red-50/40 py-8">
          <Ionicons name="megaphone-outline" size={28} color="#f87171" />
          <Text className="mt-2 text-sm text-kemix-text-secondary">
            표시할 전광판 항목이 없습니다.
          </Text>
          <Text className="mt-1 px-6 text-center text-xs text-kemix-text-secondary">
            공공 API 동기화 후 재난·특보가 자동으로 나타납니다. 안내 문구는 직접 추가할 수 있습니다.
          </Text>
        </View>
      ) : selectedRegion ? (
        filteredItems.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8">
            <Text className="text-sm text-kemix-text-secondary">
              선택한 지역에 해당하는 항목이 없습니다.
            </Text>
          </View>
        ) : (
          renderItemList(filteredItems, selectedRegion, true)
        )
      ) : (
        renderGroupedSections(groupedItems)
      )}

      <AdminEmergencyTickerItemEditModal
        visible={cacheEditItem !== null}
        item={cacheEditItem}
        onClose={() => setCacheEditItem(null)}
        onSubmit={handleCacheEditSubmit}
      />

      <AdminEmergencyNoticeFormModal
        visible={noticeFormVisible}
        editing={noticeEditItem}
        onClose={() => {
          setNoticeFormVisible(false);
          setNoticeEditItem(null);
        }}
        onSubmit={handleNoticeSubmit}
      />
    </View>
  );
}

function RegionFilterScroller({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={filterScrollerStyles.track}
      contentContainerStyle={filterScrollerStyles.content}
      {...Platform.select({
        web: { className: 'admin-region-filter-scroller' },
        default: {},
      })}
    >
      {children}
    </ScrollView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={filterScrollerStyles.chip}
      className={`rounded-full px-3 py-2 ${active ? 'bg-violet-700' : 'bg-kemix-elevated'}`}
      onPress={onPress}
    >
      <Text
        className={`text-xs font-semibold ${active ? 'text-white' : 'text-kemix-text'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const filterScrollerStyles = StyleSheet.create({
  track: {
    width: '100%',
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingRight: 8,
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
