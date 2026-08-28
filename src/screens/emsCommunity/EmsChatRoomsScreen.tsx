import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { EmsChatCreateRoomModal } from '@/components/emsCommunity/EmsChatCreateRoomModal';
import { EmsChatRoomCard } from '@/components/emsCommunity/EmsChatRoomCard';
import { EmsChatRoomView } from '@/components/emsCommunity/EmsChatRoomView';
import { CommunityListScrollHeader } from '@/components/emsCommunity/CommunityListScrollHeader';
import {
  LoungeFab,
  LoungeScreen,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useCommunityImmersive } from '@/contexts/CommunityImmersiveContext';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { EmsChatRoom } from '@/services/emsChatRoomService';

function sortRoomsByLatest(rooms: EmsChatRoom[]): EmsChatRoom[] {
  return [...rooms].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

function sortRoomsByPopularity(rooms: EmsChatRoom[]): EmsChatRoom[] {
  return [...rooms].sort((a, b) => {
    const participantDiff = b.participantCount - a.participantCount;
    if (participantDiff !== 0) return participantDiff;
    const messageDiff = b.messageCount - a.messageCount;
    if (messageDiff !== 0) return messageDiff;
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function EmsChatRoomsScreen() {
  const { lounge } = useEmsLoungeTheme();
  const loungeListContentStyle = useLoungeListContentStyle(12, true);
  const { setImmersive } = useCommunityImmersive();
  const {
    chatRooms,
    chatRoomsLoading,
    createChatRoom,
    error,
    reloadChatRooms,
  } = useParamedicCommunity();

  const [selectedRoom, setSelectedRoom] = useState<EmsChatRoom | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [bestSortActive, setBestSortActive] = useState(false);

  const visibleRooms = useMemo(
    () => (bestSortActive ? sortRoomsByPopularity(chatRooms) : sortRoomsByLatest(chatRooms)),
    [bestSortActive, chatRooms],
  );

  const handleBestToggle = useCallback(() => {
    setBestSortActive((prev) => !prev);
  }, []);

  useEffect(() => {
    setImmersive(Boolean(selectedRoom));
    return () => setImmersive(false);
  }, [selectedRoom, setImmersive]);

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

  const handleCreateRoom = async (input: {
    roomName: string;
    region?: string;
    category?: string;
    description?: string;
  }) => {
    if (input.roomName.trim().length < 2) {
      Alert.alert('입력 부족', '채팅방 이름을 2자 이상 입력해 주세요.');
      return;
    }

    setCreatingRoom(true);
    try {
      const room = await createChatRoom({
        roomName: input.roomName.trim(),
        region: input.region?.trim() || undefined,
        category: input.category?.trim() || undefined,
        description: input.description?.trim() || undefined,
      });
      setCreateModalVisible(false);
      await reloadChatRooms();
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

  if (selectedRoom) {
    return (
      <EmsChatRoomView
        room={selectedRoom}
        onBack={() => {
          setSelectedRoom(null);
          void reloadChatRooms();
        }}
      />
    );
  }

  const listHeader = (
    <CommunityListScrollHeader
      error={error}
      bestActive={bestSortActive}
      onBestToggle={handleBestToggle}
    >
      <View className="mb-2 mt-1 flex-row items-center justify-between">
        <Text
          style={{
            fontFamily: 'Pretendard',
            fontSize: 11,
            color: lounge.textMuted,
          }}
        >
          {chatRoomsLoading ? '동기화 중…' : '실시간 연결'}
        </Text>
        <Text
          style={{
            fontFamily: 'Pretendard',
            fontSize: 11,
            color: lounge.textMuted,
          }}
        >
          {chatRooms.length}개 방
        </Text>
      </View>
    </CommunityListScrollHeader>
  );

  const listEmpty = chatRoomsLoading ? (
    <Text
      className="py-10 text-center"
      style={{
        fontFamily: 'Pretendard',
        fontSize: 14,
        color: lounge.textSecondary,
      }}
    >
      채팅방을 불러오는 중…
    </Text>
  ) : (
    <View
      className="items-center py-10"
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: lounge.border,
        backgroundColor: lounge.surface,
      }}
    >
      <Ionicons name="chatbubbles-outline" size={32} color={lounge.textMuted} />
      <Text
        className="mt-3"
        style={{
          fontFamily: 'Pretendard',
          fontSize: 14,
          color: lounge.textSecondary,
        }}
      >
        열린 채팅방이 없습니다.
      </Text>
      <Text
        className="mt-1"
        style={{
          fontFamily: 'Pretendard',
          fontSize: 12,
          color: lounge.textMuted,
        }}
      >
        우측 하단 + 버튼으로 첫 채팅방을 만들어 보세요.
      </Text>
    </View>
  );

  return (
    <LoungeScreen>
      <ParamedicHeader />

      <View className="flex-1">
        <FlatList
          data={visibleRooms}
          keyExtractor={(item) => item.id}
          extraData={bestSortActive}
          contentContainerStyle={loungeListContentStyle}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={chatRooms.length === 0 ? listEmpty : null}
          renderItem={({ item }) => (
            <EmsChatRoomCard room={item} onPress={() => setSelectedRoom(item)} />
          )}
          showsVerticalScrollIndicator={false}
        />

        <LoungeFab
          onPress={() => setCreateModalVisible(true)}
          accessibilityLabel="채팅방 개설하기"
        />
      </View>

      <EmsChatCreateRoomModal
        visible={createModalVisible}
        submitting={creatingRoom}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateRoom}
      />
    </LoungeScreen>
  );
}
