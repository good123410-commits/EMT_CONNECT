import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
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
  loadHomeCommerceConfig,
  saveHomeCommerceConfig,
} from '@/services/homeDashboardService';
import type { HomeBanner, HomeCommerceItem } from '@/types/homeDashboard';

export function AdminHomeDashboardPanel() {
  const [loading, setLoading] = useState(true);
  const [savingCommerce, setSavingCommerce] = useState(false);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [commerceItems, setCommerceItems] = useState<HomeCommerceItem[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [bannerRows, commerceConfig] = await Promise.all([
        fetchAllHomeEventBanners(),
        loadHomeCommerceConfig(),
      ]);
      setBanners(bannerRows);
      setCommerceItems(commerceConfig.commerceItems);
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

  const handleDeleteBanner = (banner: HomeBanner) => {
    Alert.alert('배너 삭제', `"${banner.title || '배너'}"를 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void deleteHomeEventBanner(banner.id)
            .then(() => reload())
            .catch(() => Alert.alert('삭제 실패', '배너를 삭제하지 못했습니다.'));
        },
      },
    ]);
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
      await reload();
    } catch {
      Alert.alert('변경 실패', '노출 상태를 변경하지 못했습니다.');
    }
  };

  const updateCommerce = (id: string, patch: Partial<HomeCommerceItem>) => {
    setCommerceItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const handleSaveCommerce = async () => {
    setSavingCommerce(true);
    try {
      await saveHomeCommerceConfig(commerceItems);
      Alert.alert('저장 완료', '응급·건강 케어 큐레이션이 적용되었습니다.');
      await reload();
    } catch {
      Alert.alert('저장 실패', '큐레이션을 저장하지 못했습니다.');
    } finally {
      setSavingCommerce(false);
    }
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
                <View
                  className="h-[72px] w-[72px] items-center justify-center rounded-xl bg-kemix-elevated"
                >
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
                    onPress={() => openEdit(banner)}
                  >
                    <Text className="text-[11px] font-semibold text-kemix-text">수정</Text>
                  </Pressable>
                  <Pressable
                    className="rounded-lg bg-red-50 px-3 py-1.5"
                    onPress={() => handleDeleteBanner(banner)}
                  >
                    <Text className="text-[11px] font-semibold text-red-600">삭제</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ))
      )}

      <Text className="mb-2 mt-2 text-sm font-bold text-kemix-text">응급·건강 케어 큐레이션</Text>
      <Text className="mb-3 text-xs leading-5 text-kemix-text-secondary">
        배너 아래에 표시되는 추천 상품 영역입니다.
      </Text>

      {commerceItems.map((item, index) => (
        <View key={item.id} className="mb-4 rounded-2xl border border-kemix-border bg-kemix-surface p-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-bold text-kemix-text-secondary">큐레이션 {index + 1}</Text>
            <Switch
              value={item.isActive}
              onValueChange={(value) => updateCommerce(item.id, { isActive: value })}
            />
          </View>
          <AdminFormField
            label="제목"
            value={item.title}
            onChangeText={(text) => updateCommerce(item.id, { title: text })}
          />
          <AdminFormField
            label="설명"
            value={item.description}
            onChangeText={(text) => updateCommerce(item.id, { description: text })}
            multiline
          />
          <AdminFormField
            label="제휴 링크 URL"
            value={item.partnerUrl}
            onChangeText={(text) => updateCommerce(item.id, { partnerUrl: text })}
          />
          <AdminFormField
            label="제휴 표시명"
            value={item.partnerLabel}
            onChangeText={(text) => updateCommerce(item.id, { partnerLabel: text })}
          />
        </View>
      ))}

      <Pressable
        className={`mt-2 items-center rounded-xl py-3.5 ${savingCommerce ? 'bg-violet-300' : 'bg-violet-600 active:bg-violet-700'}`}
        onPress={() => void handleSaveCommerce()}
        disabled={savingCommerce}
      >
        <Text className="font-bold text-white">
          {savingCommerce ? '저장 중…' : '큐레이션 적용'}
        </Text>
      </Pressable>

      <AdminHomeBannerFormModal
        visible={formVisible}
        editing={editingBanner}
        onClose={() => setFormVisible(false)}
        onSubmit={handleBannerSubmit}
      />
    </ScrollView>
  );
}
