import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Image, ScrollView, Switch, Text, View } from 'react-native';
import { AdminCommerceCurationAccordion } from '@/components/admin/panels/AdminCommerceCurationAccordion';
import {
  AdminEmergencyNoticeFormModal,
  type EmergencyNoticeFormValues,
} from '@/components/admin/panels/AdminEmergencyNoticeFormModal';
import {
  AdminHomeBannerFormModal,
  type HomeBannerFormValues,
} from '@/components/admin/panels/AdminHomeBannerFormModal';
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
import {
  deleteHomeEmergencyNotice,
  fetchAllHomeEmergencyNotices,
  upsertHomeEmergencyNotice,
} from '@/services/homeEmergencyNoticeService';
import type { HomeBanner, HomeCommerceItem } from '@/types/homeDashboard';
import type { HomeEmergencyNotice } from '@/types/emergencyTicker';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';
import { withStopPropagation } from '@/utils/pressEvent';

export function AdminHomeDashboardPanel() {
  const [loading, setLoading] = useState(true);
  const [savingCommerceId, setSavingCommerceId] = useState<string | null>(null);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [emergencyNotices, setEmergencyNotices] = useState<HomeEmergencyNotice[]>([]);
  const [commerceItems, setCommerceItems] = useState<HomeCommerceItem[]>([]);
  const [expandedCommerceIds, setExpandedCommerceIds] = useState<Set<string>>(new Set());
  const [formVisible, setFormVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);
  const [noticeFormVisible, setNoticeFormVisible] = useState(false);
  const [editingNotice, setEditingNotice] = useState<HomeEmergencyNotice | null>(null);
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
      const [bannerRows, noticeRows, commerceConfig] = await Promise.all([
        fetchAllHomeEventBanners(),
        fetchAllHomeEmergencyNotices(),
        loadHomeCommerceConfig(),
      ]);
      setBanners(bannerRows);
      setEmergencyNotices(noticeRows);
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
    setEditingNotice(null);
    setNoticeFormVisible(true);
  };

  const openEditNotice = (notice: HomeEmergencyNotice) => {
    setEditingNotice(notice);
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
    const nextSort =
      editingNotice?.sortOrder ??
      emergencyNotices.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

    await upsertHomeEmergencyNotice({
      id: editingNotice?.id,
      message: values.message,
      isActive: values.isActive,
      sortOrder: nextSort,
    });
    await reload();
    Alert.alert('저장 완료', '긴급 공지가 홈 전광판 최우선으로 반영됩니다.');
  };

  const handleDeleteNotice = (targetId: string, message: string) => {
    confirmDestructiveAction('긴급 공지 삭제', `"${message || '공지'}"를 삭제하시겠습니까?`, async () => {
      try {
        await deleteHomeEmergencyNotice(targetId);
        await reload();
      } catch (err) {
        Alert.alert(
          '삭제 실패',
          err instanceof Error ? err.message : '긴급 공지를 삭제하지 못했습니다.',
        );
      }
    });
  };

  const toggleNoticeActive = async (notice: HomeEmergencyNotice, isActive: boolean) => {
    try {
      await upsertHomeEmergencyNotice({
        id: notice.id,
        message: notice.message,
        isActive,
        sortOrder: notice.sortOrder,
        expiresAt: notice.expiresAt,
      });
      setEmergencyNotices((prev) =>
        prev.map((row) => (row.id === notice.id ? { ...row, isActive } : row)),
      );
    } catch {
      Alert.alert('변경 실패', '긴급 공지 노출 상태를 변경하지 못했습니다.');
    }
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

  if (loading) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-bold text-kemix-text">긴급 공지 (전광판)</Text>
          <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">
            홈 이벤트 배너 아래 LED 전광판에 최우선 노출됩니다. 공공 API 재난 알림보다 앞에 표시됩니다.
          </Text>
        </View>
        <Pressable
          className="flex-row items-center rounded-xl bg-red-600 px-3 py-2 active:bg-red-700"
          onPress={openCreateNotice}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="ml-1 text-xs font-bold text-white">공지 추가</Text>
        </Pressable>
      </View>

      {emergencyNotices.length === 0 ? (
        <View className="mb-6 items-center rounded-2xl border border-dashed border-red-200 bg-red-50/40 py-8">
          <Ionicons name="megaphone-outline" size={28} color="#f87171" />
          <Text className="mt-2 text-sm text-kemix-text-secondary">등록된 긴급 공지가 없습니다.</Text>
        </View>
      ) : (
        emergencyNotices.map((notice) => (
          <View
            key={notice.id}
            className="mb-3 rounded-2xl border border-red-200 bg-kemix-surface p-3"
          >
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-sm font-semibold text-kemix-text" numberOfLines={3}>
                {notice.message || '내용 없음'}
              </Text>
              <Switch
                value={notice.isActive}
                onValueChange={(value) => void toggleNoticeActive(notice, value)}
              />
            </View>
            <View className="mt-2 flex-row gap-2">
              <Pressable
                className="rounded-lg bg-kemix-elevated px-3 py-1.5"
                onPress={withStopPropagation(() => openEditNotice(notice))}
              >
                <Text className="text-[11px] font-semibold text-kemix-text">수정</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-red-50 px-3 py-1.5"
                onPress={withStopPropagation(() => handleDeleteNotice(notice.id, notice.message))}
              >
                <Text className="text-[11px] font-semibold text-red-600">삭제</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <View className="mb-3 mt-2 flex-row items-center justify-between">
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
        <View className="mb-6 items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-10">
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

      <View className="mb-3 mt-2 flex-row items-center justify-between">
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

      <AdminHomeBannerFormModal
        visible={formVisible}
        editing={editingBanner}
        onClose={() => setFormVisible(false)}
        onSubmit={handleBannerSubmit}
      />

      <AdminEmergencyNoticeFormModal
        visible={noticeFormVisible}
        editing={editingNotice}
        onClose={() => setNoticeFormVisible(false)}
        onSubmit={handleNoticeSubmit}
      />
    </ScrollView>
  );
}
