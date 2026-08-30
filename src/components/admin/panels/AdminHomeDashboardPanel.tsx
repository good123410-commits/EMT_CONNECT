import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Image, ScrollView, Switch, Text, View } from 'react-native';
import { AdminCommerceCurationAccordion } from '@/components/admin/panels/AdminCommerceCurationAccordion';
import {
  AdminEmergencyNoticeFormModal,
  type EmergencyNoticeFormValues,
} from '@/components/admin/panels/AdminEmergencyNoticeFormModal';
import { AdminEmergencyTickerPanel } from '@/components/admin/panels/AdminEmergencyTickerPanel';
import {
  AdminHomeBannerFormModal,
  type HomeBannerFormValues,
} from '@/components/admin/panels/AdminHomeBannerFormModal';
import { SegmentControl } from '@/components/SegmentControl';
import {
  deleteHomeEventBanner,
  fetchAllHomeEventBanners,
  upsertHomeEventBanner,
} from '@/services/homeBannerService';
import {
  createCommerceItem,
  loadHomeCommerceConfig,
  saveHomeCommerceConfig,
} from '@/services/homeDashboardService';
import { upsertHomeEmergencyNotice } from '@/services/homeEmergencyNoticeService';
import type { HomeBanner, HomeCommerceItem } from '@/types/homeDashboard';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';
import { withStopPropagation } from '@/utils/pressEvent';

type HomeDashboardSubTab = 'ticker' | 'event' | 'curation';

const HOME_DASHBOARD_SUB_TABS: { value: HomeDashboardSubTab; label: string }[] = [
  { value: 'ticker', label: '전광판 배너' },
  { value: 'event', label: '이벤트 배너' },
  { value: 'curation', label: '큐레이션' },
];

export function AdminHomeDashboardPanel() {
  const [activeTab, setActiveTab] = useState<HomeDashboardSubTab>('ticker');
  const [loading, setLoading] = useState(true);
  const [savingCommerceId, setSavingCommerceId] = useState<string | null>(null);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [commerceItems, setCommerceItems] = useState<HomeCommerceItem[]>([]);
  const [expandedCommerceIds, setExpandedCommerceIds] = useState<Set<string>>(new Set());
  const [formVisible, setFormVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);
  const [noticeFormVisible, setNoticeFormVisible] = useState(false);
  const commerceItemsRef = useRef<HomeCommerceItem[]>([]);

  useEffect(() => {
    commerceItemsRef.current = commerceItems;
  }, [commerceItems]);

  const buildCommerceSnapshot = useCallback((editedItem: HomeCommerceItem): HomeCommerceItem[] => {
    const current = commerceItemsRef.current;
    const index = current.findIndex((row) => row.id === editedItem.id);
    if (index === -1) {
      return [...current, editedItem];
    }
    return current.map((row) => (row.id === editedItem.id ? { ...row, ...editedItem } : row));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [bannerRows, commerceConfig] = await Promise.all([
        fetchAllHomeEventBanners(),
        loadHomeCommerceConfig(),
      ]);
      setBanners(bannerRows);
      setCommerceItems(commerceConfig.commerceItems);
      commerceItemsRef.current = commerceConfig.commerceItems;
    } catch {
      Alert.alert('조회 실패', '홈 설정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openCreate = () => {
    setEditingBanner(null);
    setFormVisible(true);
  };

  const openCreateNotice = () => {
    setNoticeFormVisible(true);
  };

  const openEdit = (banner: HomeBanner) => {
    setEditingBanner(banner);
    setFormVisible(true);
  };

  const handleBannerSubmit = async (values: HomeBannerFormValues) => {
    const nextSort =
      editingBanner?.sortOrder ??
      banners.reduce((max, b) => Math.max(max, b.sortOrder), -1) + 1;

    await upsertHomeEventBanner({
      id: editingBanner?.id,
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl.trim() || null,
      linkUrl: values.linkUrl,
      isActive: values.isActive,
      sortOrder: nextSort,
    });
    await reload();
    Alert.alert('저장 완료', '배너가 앱 홈에 즉시 반영됩니다.');
  };

  const handleNoticeSubmit = async (values: EmergencyNoticeFormValues) => {
    await upsertHomeEmergencyNotice({
      message: values.message,
      isActive: values.isActive,
      sortOrder: 0,
    });
    Alert.alert('저장 완료', '안내 문구가 홈 전광판에 즉시 반영됩니다.');
  };

  const handleDeleteBanner = (targetId: string, title: string) => {
    const normalizedId = targetId?.trim();
    if (!normalizedId) {
      Alert.alert('삭제 실패', '배너 ID를 확인할 수 없습니다.');
      return;
    }

    if (__DEV__) {
      console.log('[AdminHomeDashboardPanel] handleDeleteBanner targetId:', normalizedId);
    }

    confirmDestructiveAction(
      '배너 삭제',
      `"${title || '배너'}"를 삭제하시겠습니까?`,
      async () => {
        let previousBanners: HomeBanner[] = [];
        setBanners((prev) => {
          previousBanners = prev;
          return prev.filter((row) => row.id !== normalizedId);
        });

        setEditingBanner((current) => {
          if (current?.id === normalizedId) {
            setFormVisible(false);
            return null;
          }
          return current;
        });

        try {
          await deleteHomeEventBanner(normalizedId);
        } catch (err) {
          setBanners(previousBanners);
          Alert.alert(
            '삭제 실패',
            err instanceof Error ? err.message : '배너를 삭제하지 못했습니다.',
          );
        }
      },
    );
  };

  const toggleBannerActive = async (banner: HomeBanner, isActive: boolean) => {
    try {
      await upsertHomeEventBanner({
        id: banner.id,
        title: banner.title,
        description: banner.description,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        isActive,
        sortOrder: banner.sortOrder,
      });
      setBanners((prev) =>
        prev.map((row) => (row.id === banner.id ? { ...row, isActive } : row)),
      );
    } catch {
      Alert.alert('변경 실패', '노출 상태를 변경하지 못했습니다.');
    }
  };

  const updateCommerce = (id: string, patch: Partial<HomeCommerceItem>) => {
    setCommerceItems((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      commerceItemsRef.current = next;
      return next;
    });
  };

  const toggleCommerceExpanded = (id: string) => {
    setExpandedCommerceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddCommerce = () => {
    const nextSort = commerceItemsRef.current.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
    const created = createCommerceItem(nextSort);
    setCommerceItems((prev) => {
      const next = [...prev, created];
      commerceItemsRef.current = next;
      return next;
    });
    setExpandedCommerceIds((prev) => new Set(prev).add(created.id));
  };

  const handleSaveCommerceItem = async (item: HomeCommerceItem) => {
    setSavingCommerceId(item.id);
    try {
      const itemsToSave = buildCommerceSnapshot(item);
      const saved = await saveHomeCommerceConfig(itemsToSave);
      setCommerceItems(saved.commerceItems);
      commerceItemsRef.current = saved.commerceItems;
      Alert.alert('저장 완료', `"${item.title.trim() || '큐레이션'}" 항목이 적용되었습니다.`);
    } catch (err) {
      Alert.alert(
        '저장 실패',
        err instanceof Error ? err.message : '큐레이션을 저장하지 못했습니다.',
      );
    } finally {
      setSavingCommerceId(null);
    }
  };

  const handleDeleteCommerceItem = (targetId: string, title: string) => {
    const normalizedId = targetId?.trim();
    if (!normalizedId) {
      Alert.alert('삭제 실패', '큐레이션 ID를 확인할 수 없습니다.');
      return;
    }

    if (__DEV__) {
      console.log('[AdminHomeDashboardPanel] handleDeleteCommerceItem targetId:', normalizedId);
    }

    confirmDestructiveAction(
      '큐레이션 삭제',
      `"${title.trim() || '큐레이션'}" 항목을 삭제하시겠습니까?`,
      async () => {
        const previousItems = commerceItemsRef.current;
        const nextItems = previousItems.filter((row) => row.id !== normalizedId);

        setCommerceItems(nextItems);
        commerceItemsRef.current = nextItems;

        setExpandedCommerceIds((prev) => {
          const next = new Set(prev);
          next.delete(normalizedId);
          return next;
        });

        setSavingCommerceId(normalizedId);
        try {
          const saved = await saveHomeCommerceConfig(nextItems);
          setCommerceItems(saved.commerceItems);
          commerceItemsRef.current = saved.commerceItems;
        } catch (err) {
          setCommerceItems(previousItems);
          commerceItemsRef.current = previousItems;
          Alert.alert(
            '삭제 실패',
            err instanceof Error ? err.message : '큐레이션을 삭제하지 못했습니다.',
          );
        } finally {
          setSavingCommerceId(null);
        }
      },
    );
  };

  const renderEventBannerTab = () => {
    if (loading) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator color="#7c3aed" />
        </View>
      );
    }

    return (
      <>
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-sm font-bold text-kemix-text">이벤트 배너</Text>
            <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">
              게시글처럼 추가·수정·삭제. 저장 즉시 앱 홈 슬라이드에 반영됩니다.
            </Text>
          </View>
          <Pressable
            className="flex-row items-center rounded-xl bg-violet-600 px-3 py-2 active:bg-violet-700"
            onPress={openCreate}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="ml-1 text-xs font-bold text-white">배너 추가</Text>
          </Pressable>
        </View>

        {banners.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-10">
            <Ionicons name="images-outline" size={28} color="#cbd5e1" />
            <Text className="mt-2 text-sm text-kemix-text-secondary">등록된 배너가 없습니다.</Text>
          </View>
        ) : (
          banners.map((banner) => (
            <View key={banner.id} className="mb-3 rounded-2xl border border-kemix-border bg-kemix-surface p-3">
              <View className="flex-row items-start gap-3">
                {banner.imageUrl ? (
                  <Image
                    source={{ uri: banner.imageUrl }}
                    style={{ width: 72, height: 72, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-[72px] w-[72px] items-center justify-center rounded-xl bg-kemix-elevated">
                    <Ionicons name="image-outline" size={24} color="#94a3b8" />
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-kemix-text" numberOfLines={1}>
                      {banner.title || '제목 없음'}
                    </Text>
                    <Switch
                      value={banner.isActive}
                      onValueChange={(value) => void toggleBannerActive(banner, value)}
                    />
                  </View>
                  <Text className="mt-1 text-xs text-kemix-text-secondary" numberOfLines={2}>
                    {banner.description || '설명 없음'}
                  </Text>
                  {banner.linkUrl ? (
                    <Text className="mt-1 text-[10px] text-violet-600" numberOfLines={1}>
                      {banner.linkUrl}
                    </Text>
                  ) : null}
                  <View className="mt-2 flex-row gap-2">
                    <Pressable
                      className="rounded-lg bg-kemix-elevated px-3 py-1.5"
                      onPress={withStopPropagation(() => openEdit(banner))}
                    >
                      <Text className="text-[11px] font-semibold text-kemix-text">수정</Text>
                    </Pressable>
                    <Pressable
                      className="rounded-lg bg-red-50 px-3 py-1.5"
                      onPress={withStopPropagation(() =>
                        handleDeleteBanner(banner.id, banner.title),
                      )}
                    >
                      <Text className="text-[11px] font-semibold text-red-600">삭제</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </>
    );
  };

  const renderCurationTab = () => {
    if (loading) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator color="#7c3aed" />
        </View>
      );
    }

    return (
      <>
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-sm font-bold text-kemix-text">응급·건강 케어 큐레이션</Text>
            <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">
              배너 아래 추천 상품 영역입니다. 항목을 펼쳐 수정·저장·삭제할 수 있습니다.
            </Text>
          </View>
          <Pressable
            className="flex-row items-center rounded-xl bg-violet-600 px-3 py-2 active:bg-violet-700"
            onPress={handleAddCommerce}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="ml-1 text-xs font-bold text-white">큐레이션 추가</Text>
          </Pressable>
        </View>

        {commerceItems.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-10">
            <Ionicons name="cart-outline" size={28} color="#cbd5e1" />
            <Text className="mt-2 text-sm text-kemix-text-secondary">등록된 큐레이션이 없습니다.</Text>
          </View>
        ) : (
          commerceItems.map((item, index) => (
            <AdminCommerceCurationAccordion
              key={item.id}
              item={item}
              index={index}
              expanded={expandedCommerceIds.has(item.id)}
              saving={savingCommerceId === item.id}
              onToggle={() => toggleCommerceExpanded(item.id)}
              onChange={(patch) => updateCommerce(item.id, patch)}
              onSave={() => void handleSaveCommerceItem(item)}
              onDelete={() => handleDeleteCommerceItem(item.id, item.title)}
            />
          ))
        )}
      </>
    );
  };

  return (
    <View className="flex-1">
      <SegmentControl
        options={HOME_DASHBOARD_SUB_TABS}
        value={activeTab}
        onChange={setActiveTab}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8 pt-3"
      >
        {activeTab === 'ticker' ? (
          <AdminEmergencyTickerPanel onCreateNotice={openCreateNotice} />
        ) : null}
        {activeTab === 'event' ? renderEventBannerTab() : null}
        {activeTab === 'curation' ? renderCurationTab() : null}
      </ScrollView>

      <AdminHomeBannerFormModal
        visible={formVisible}
        editing={editingBanner}
        onClose={() => setFormVisible(false)}
        onSubmit={handleBannerSubmit}
      />

      <AdminEmergencyNoticeFormModal
        visible={noticeFormVisible}
        editing={null}
        onClose={() => setNoticeFormVisible(false)}
        onSubmit={handleNoticeSubmit}
      />
    </View>
  );
}
