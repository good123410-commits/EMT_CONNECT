import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Alert, FlatList, Text, View } from 'react-native';
import { LocalCommunityChatRoomView } from '@/components/utilities/LocalCommunityChatRoomView';
import { LocalCommunityCreateRoomModal } from '@/components/utilities/LocalCommunityCreateRoomModal';
import { LocalCommunityRoomCard } from '@/components/utilities/LocalCommunityRoomCard';
import { KoreanRegionSelector, KoreanRegionTitle } from '@/components/utilities/KoreanRegionSelector';
import { UtilityToolShell } from '@/components/utilities/UtilityToolShell';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import { APP_SPACING } from '@/constants/appTheme';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { KOREAN_SIGUNGU_UNITS } from '@/constants/koreanRegions';
import {
  createLocalCommunityRoom,
  fetchLocalCommunityRooms,
  loadSelectedRegionCode,
  MAX_LOCAL_COMMUNITY_ROOMS_PER_SIGUNGU,
  saveSelectedRegionCode,
  subscribeLocalCommunityRoomList,
} from '@/services/localCommunityChatService';
import { getLocationWithRegion } from '@/services/locationService';
import type { LocalCommunityCategory, LocalCommunityRoom } from '@/types/localCommunity';
import {
  getRegionUnitByCode,
  parseRegionRouteParam,
  resolveRegionCodeFromLocation,
} from '@/utils/koreanRegionResolver';

const COMMUNITY_ROUTE_PATH = 'local-community';

function isLocalCommunityDeepLink(url: string): string | null {
  if (!url.includes(COMMUNITY_ROUTE_PATH)) return null;
  const match = url.match(/[?&]region=([^&]+)/);
  if (!match?.[1]) return null;
  return parseRegionRouteParam(match[1]);
}

export function LocalCommunityTalkScreen({ embedded = false }: { embedded?: boolean }) {
  const [bootLoading, setBootLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [regionCode, setRegionCode] = useState<string | null>(null);
  const [rooms, setRooms] = useState<LocalCommunityRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<LocalCommunityRoom | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async (code: string) => {
    setRoomsLoading(true);
    try {
      const rows = await fetchLocalCommunityRooms(code);
      setRooms(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '채팅방 목록을 불러오지 못했습니다.');
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const applyRegionCode = useCallback(async (code: string) => {
    setRegionCode(code);
    setSelectedRoom(null);
    await saveSelectedRegionCode(code);
  }, []);

  useEffect(() => {
    void (async () => {
      const saved = await loadSelectedRegionCode();
      if (saved && getRegionUnitByCode(saved)) {
        setRegionCode(saved);
      } else {
        try {
          const snapshot = await getLocationWithRegion();
          const detected = resolveRegionCodeFromLocation(snapshot.region);
          if (detected) {
            setRegionCode(detected);
            await saveSelectedRegionCode(detected);
          } else {
            setRegionCode(KOREAN_SIGUNGU_UNITS[0]?.code ?? null);
          }
        } catch {
          setRegionCode(KOREAN_SIGUNGU_UNITS[0]?.code ?? null);
        }
      }
      setBootLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!regionCode) return;

    void loadRooms(regionCode);

    const unsubscribe = subscribeLocalCommunityRoomList(regionCode, () => {
      void loadRooms(regionCode);
    });

    return unsubscribe;
  }, [regionCode, loadRooms]);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const code = isLocalCommunityDeepLink(event.url);
      if (code) void applyRegionCode(code);
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (!url) return;
      const code = isLocalCommunityDeepLink(url);
      if (code) void applyRegionCode(code);
    });

    return () => subscription.remove();
  }, [applyRegionCode]);

  useHardwareBackHandler(() => {
    if (createModalVisible) {
      setCreateModalVisible(false);
      return true;
    }
    if (selectedRoom) {
      setSelectedRoom(null);
      return true;
    }
    return false;
  });

  const selectedRegion = getRegionUnitByCode(regionCode);
  const fabBottomInset = useGlobalFabBottomInset();
  const roomQuotaReached = rooms.length >= MAX_LOCAL_COMMUNITY_ROOMS_PER_SIGUNGU;

  const handleOpenCreateModal = () => {
    if (roomQuotaReached) {
      Alert.alert(
        '개설 제한',
        '해당 시/군/구에는 이미 최대 3개의 채팅방이 개설되어 있습니다.',
      );
      return;
    }
    setCreateModalVisible(true);
  };

  const handleCreateRoom = async (input: {
    title: string;
    topic?: string;
    category?: LocalCommunityCategory;
    description?: string;
  }) => {
    if (!regionCode) {
      Alert.alert('지역 선택', '먼저 시·군·구를 선택해 주세요.');
      return;
    }

    setCreatingRoom(true);
    try {
      const room = await createLocalCommunityRoom({
        regionCode,
        title: input.title,
        topic: input.topic,
        category: input.category,
        description: input.description,
      });
      setCreateModalVisible(false);
      setRooms((prev) => [room, ...prev.filter((item) => item.id !== room.id)]);
      setSelectedRoom(room);
    } catch (err) {
      Alert.alert(
        '개설 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setCreatingRoom(false);
    }
  };

  if (bootLoading) {
    const loadingText = (
      <Text className="text-center text-sm text-kemix-text-secondary">불러오는 중…</Text>
    );
    if (embedded) {
      return (
        <View className="flex-1 items-center justify-center bg-kemix-bg px-4">
          {loadingText}
        </View>
      );
    }
    return <UtilityToolShell>{loadingText}</UtilityToolShell>;
  }

  if (selectedRoom) {
    return (
      <LocalCommunityChatRoomView
        room={selectedRoom}
        embedded={embedded}
        onBack={() => setSelectedRoom(null)}
      />
    );
  }

  const listHeader = (
    <View>
      {selectedRegion ? (
        <View className="mb-3">
          <KoreanRegionTitle unit={selectedRegion} />
        </View>
      ) : null}

      <View className="mb-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
        <Text className="text-xs font-semibold text-sky-700">이 지역 채팅방 이용 현황</Text>
        <Text className="mt-1 text-base font-bold text-sky-900">
          개설된 채팅방 {rooms.length}/{MAX_LOCAL_COMMUNITY_ROOMS_PER_SIGUNGU}
        </Text>
        <Text className="mt-1 text-xs leading-5 text-sky-800/80">
          시·군·구당 최대 {MAX_LOCAL_COMMUNITY_ROOMS_PER_SIGUNGU}개까지 개설할 수 있습니다.
        </Text>
      </View>

      <KoreanRegionSelector
        selectedCode={regionCode}
        onSelect={(code) => void applyRegionCode(code)}
        detecting={detecting}
        onDetectStart={() => setDetecting(true)}
        onDetectEnd={() => setDetecting(false)}
      />

      <Pressable
        className="mb-4 mt-3 flex-row items-center justify-center rounded-xl py-3 active:opacity-90"
        style={{ backgroundColor: roomQuotaReached ? '#94a3b8' : '#2563eb' }}
        onPress={handleOpenCreateModal}
      >
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text className="ml-2 text-sm font-bold text-white">채팅방 개설하기</Text>
      </Pressable>

      {error ? (
        <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-700">{error}</Text>
        </View>
      ) : null}

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[11px] text-kemix-muted">
          {roomsLoading ? '동기화 중…' : '실시간 연결'}
        </Text>
        <Text className="text-[11px] text-kemix-muted">{rooms.length}개 방</Text>
      </View>
    </View>
  );

  const listEmpty = roomsLoading ? (
    <Text className="py-10 text-center text-sm text-kemix-text-secondary">
      채팅방을 불러오는 중…
    </Text>
  ) : (
    <View className="items-center rounded-2xl border border-dashed border-kemix-border bg-kemix-surface py-10">
      <Ionicons name="chatbubbles-outline" size={32} color="#cbd5e1" />
      <Text className="mt-3 text-sm text-kemix-text-secondary">이 지역에 열린 채팅방이 없습니다.</Text>
      <Text className="mt-1 text-xs text-kemix-muted">위 버튼으로 첫 채팅방을 만들어 보세요.</Text>
    </View>
  );

  const roomList = (
    <>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: APP_SPACING.contentHorizontal,
          paddingTop: embedded ? 12 : 0,
          paddingBottom: fabBottomInset,
        }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <LocalCommunityRoomCard room={item} onPress={() => setSelectedRoom(item)} />
        )}
        showsVerticalScrollIndicator={false}
      />

      <LocalCommunityCreateRoomModal
        visible={createModalVisible}
        submitting={creatingRoom}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateRoom}
      />
    </>
  );

  if (embedded) {
    return (
      <ThemedScreen>
        <View className="flex-1">{roomList}</View>
      </ThemedScreen>
    );
  }

  return <UtilityToolShell>{roomList}</UtilityToolShell>;
}
