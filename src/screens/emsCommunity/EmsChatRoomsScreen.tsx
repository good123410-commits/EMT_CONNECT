import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { EmsChatCreateRoomModal } from '@/components/emsCommunity/EmsChatCreateRoomModal';
import { EmsChatRoomCard } from '@/components/emsCommunity/EmsChatRoomCard';
import { EmsChatRoomView } from '@/components/emsCommunity/EmsChatRoomView';
import { CommunityBestSection } from '@/components/emsCommunity/CommunityBestSection';
import {
  LoungeErrorBanner,
  LoungePrimaryButton,
  LoungeScreen,
  LoungeTopSection,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { EmsChatRoom } from '@/services/emsChatRoomService';

const BEST_ROOM_LIMIT = 3;

function sortRoomsByLatest(rooms: EmsChatRoom[]): EmsChatRoom[] {
  return [...rooms].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

function pickBestRooms(rooms: EmsChatRoom[]): EmsChatRoom[] {
  return [...rooms]
    .sort((a, b) => b.participantCount - a.participantCount || b.messageCount - a.messageCount)
    .slice(0, BEST_ROOM_LIMIT);
}

export function EmsChatRoomsScreen() {
  const { lounge } = useEmsLoungeTheme();
  const loungeListContentStyle = useLoungeListContentStyle();
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

  const bestItems = useMemo(() => pickBestRooms(chatRooms), [chatRooms]);

  const bestIdSet = useMemo(() => new Set(bestItems.map((room) => room.id)), [bestItems]);

  const visibleRooms = useMemo(
    () => sortRoomsByLatest(chatRooms.filter((room) => !bestIdSet.has(room.id))),
    [bestIdSet, chatRooms],
  );

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
    <View>
      <LoungeTopSection>
        <Text
          style={{
            fontFamily: 'Pretendard-Bold',
            fontSize: 18,
            color: lounge.text,
          }}
        >
          소통창
        </Text>
        <Text
          className="mt-1"
          style={{
            fontFamily: 'Pretendard',
            fontSize: 13,
            color: lounge.textSecondary,
          }}
        >
          주제별 오픈채팅방에서 실시간으로 소통해 보세요.
        </Text>
      </LoungeTopSection>

      <View style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}>
        <LoungePrimaryButton
          label="채팅방 개설하기"
          icon="add-circle-outline"
          onPress={() => setCreateModalVisible(true)}
        />

        {error ? (
          <View className="mt-3">
            <LoungeErrorBanner message={error} />
          </View>
        ) : null}

        <View className="mb-2 mt-4 flex-row items-center justify-between">
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

        <CommunityBestSection
          items={bestItems}
          renderItem={(room) => (
            <EmsChatRoomCard room={room} onPress={() => setSelectedRoom(room)} />
          )}
        />
      </View>
    </View>
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
        위 버튼으로 첫 채팅방을 만들어 보세요.
      </Text>
    </View>
  );

  return (
    <LoungeScreen>
      <ParamedicHeader />

      <FlatList
        data={visibleRooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={loungeListContentStyle}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={chatRooms.length === 0 ? listEmpty : null}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <EmsChatRoomCard room={item} onPress={() => setSelectedRoom(item)} />
        )}
        showsVerticalScrollIndicator={false}
      />

      <EmsChatCreateRoomModal
        visible={createModalVisible}
        submitting={creatingRoom}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateRoom}
      />
    </LoungeScreen>
  );
}
