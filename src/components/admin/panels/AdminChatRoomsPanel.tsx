import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  adminCreateChatRoom,
  adminDeactivateChatRoom,
  adminFetchChatRoomMessages,
  fetchActiveChatRooms,
  type EmsChatRoom,
} from '@/services/emsChatRoomService';
import type { ChatMessage } from '@/data/paramedicMockData';
import { subscribeEmsChatRoomsTable, subscribeEmsCommunityPostsTable } from '@/lib/realtimeSubscription';

const EMPTY_FORM = {
  roomName: '',
  region: '',
  category: '',
  description: '',
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animatePanelToggle() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function AdminChatRoomsPanel() {
  const [rooms, setRooms] = useState<EmsChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [closeTarget, setCloseTarget] = useState<EmsChatRoom | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const toggleCreateForm = () => {
    animatePanelToggle();
    setCreateFormOpen((prev) => !prev);
  };

  const reloadRooms = useCallback(async () => {
    try {
      const rows = await fetchActiveChatRooms();
      setRooms(rows);
      if (selectedRoomId && !rows.some((room) => room.id === selectedRoomId)) {
        setSelectedRoomId(rows[0]?.id ?? null);
      }
    } catch (error) {
      console.error('[AdminChatRooms] reloadRooms failed', error);
      Alert.alert('조회 실패', error instanceof Error ? error.message : '채팅방을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedRoomId]);

  const reloadMessages = useCallback(async (roomId: string) => {
    setMessagesLoading(true);
    try {
      const rows = await adminFetchChatRoomMessages(roomId);
      setMessages(rows);
    } catch (error) {
      Alert.alert('조회 실패', error instanceof Error ? error.message : '메시지를 불러올 수 없습니다.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadRooms();
    const unsubscribeRooms = subscribeEmsChatRoomsTable(() => {
      void reloadRooms();
    });
    const unsubscribePosts = subscribeEmsCommunityPostsTable(() => {
      if (selectedRoomId) void reloadMessages(selectedRoomId);
    });
    return () => {
      unsubscribeRooms();
      unsubscribePosts();
    };
  }, [reloadRooms, reloadMessages, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }
    void reloadMessages(selectedRoomId);
  }, [selectedRoomId, reloadMessages]);

  const handleCreateRoom = async () => {
    if (!form.roomName.trim()) {
      Alert.alert('입력 필요', '채팅방 이름을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const room = await adminCreateChatRoom({
        roomName: form.roomName.trim(),
        region: form.region.trim() || undefined,
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      setSelectedRoomId(room.id);
      animatePanelToggle();
      setCreateFormOpen(false);
      await reloadRooms();
      Alert.alert('완료', `"${room.roomName}" 채팅방이 생성되었습니다.`);
    } catch (error) {
      Alert.alert('실패', error instanceof Error ? error.message : '생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!closeTarget) return;
    const roomId = closeTarget.id;
    const roomName = closeTarget.roomName;

    setSubmitting(true);
    setCloseTarget(null);
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      setMessages([]);
    }

    try {
      await adminDeactivateChatRoom(roomId);
      await reloadRooms();
      Alert.alert('완료', `"${roomName}" 채팅방이 폐쇄되었습니다.`);
    } catch (error) {
      console.error('[AdminChatRooms] handleCloseRoom failed', { roomId, roomName, error });
      await reloadRooms();
      Alert.alert('실패', error instanceof Error ? error.message : '폐쇄에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Pressable
        className="flex-row items-center justify-between rounded-xl border border-violet-200 bg-white px-4 py-3 active:bg-violet-50"
        onPress={toggleCreateForm}
      >
        <Text className="text-sm font-bold text-violet-800">+ 채팅방 개설하기</Text>
        <Ionicons
          name={createFormOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#6d28d9"
        />
      </Pressable>

      {createFormOpen ? (
        <View className="mt-2 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <Text className="mb-1 text-sm font-bold text-violet-900">채팅방 생성</Text>
          <AdminFormField
            label="방 이름"
            value={form.roomName}
            onChangeText={(value) => setForm((prev) => ({ ...prev, roomName: value }))}
            placeholder="채팅방 이름"
          />
          <AdminFormField
            label="지역"
            value={form.region}
            onChangeText={(value) => setForm((prev) => ({ ...prev, region: value }))}
            placeholder="지역"
          />
          <AdminFormField
            label="주제"
            value={form.category}
            onChangeText={(value) => setForm((prev) => ({ ...prev, category: value }))}
            placeholder="주제/분류"
          />
          <AdminFormField
            label="설명"
            value={form.description}
            onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
            placeholder="안내 문구"
            multiline
          />
          <Pressable
            className={`items-center rounded-xl py-3 ${submitting ? 'bg-violet-300' : 'bg-violet-700'}`}
            disabled={submitting}
            onPress={() => void handleCreateRoom()}
          >
            <Text className="font-bold text-white">{submitting ? '생성 중...' : '채팅방 생성'}</Text>
          </Pressable>
        </View>
      ) : null}

      <Text className="mb-2 mt-3 text-sm font-bold text-slate-900">채팅방 목록 · 모니터링</Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        style={{ flexGrow: 0, maxHeight: createFormOpen ? 160 : 220 }}
        contentContainerStyle={{ paddingBottom: 4 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="py-6 text-center text-sm text-slate-500">등록된 채팅방이 없습니다.</Text>
        }
        renderItem={({ item }) => {
          const active = selectedRoomId === item.id;
          return (
            <View
              className={`mb-2 rounded-xl border p-3 ${active ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'}`}
            >
              <Pressable onPress={() => setSelectedRoomId(item.id)}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="font-semibold text-slate-900">{item.roomName}</Text>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      {[item.region, item.category].filter(Boolean).join(' · ') || '분류 없음'}
                    </Text>
                  </View>
                  <Text className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                    운영중
                  </Text>
                </View>
              </Pressable>
              <Pressable
                className="mt-2 self-start rounded-lg bg-red-100 px-2.5 py-1"
                onPress={() => setCloseTarget(item)}
              >
                <Text className="text-[11px] font-bold text-red-700">폐쇄</Text>
              </Pressable>
            </View>
          );
        }}
      />

      <View className="mt-2 min-h-0 flex-1 rounded-2xl border border-slate-200 bg-white p-3">
        <Text className="mb-2 text-sm font-bold text-slate-900">
          {selectedRoom ? `${selectedRoom.roomName} 대화` : '채팅방을 선택하세요'}
        </Text>
        {messagesLoading ? (
          <ActivityIndicator color="#7c3aed" className="py-6" />
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {messages.length === 0 ? (
              <Text className="py-8 text-center text-sm text-slate-500">메시지가 없습니다.</Text>
            ) : (
              messages.map((message) => (
                <View key={message.id} className="mb-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-700">{message.anonymousLabel}</Text>
                    <Text className="text-[10px] text-slate-400">{message.postedAt}</Text>
                  </View>
                  <Text className="mt-1 text-sm text-slate-700">{message.content}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      <AdminConfirmModal
        visible={!!closeTarget}
        title="채팅방 폐쇄"
        message={`"${closeTarget?.roomName}" 채팅방을 폐쇄하시겠습니까? 접속 중인 사용자는 즉시 나가게 됩니다.`}
        confirmLabel="폐쇄"
        destructive
        loading={submitting}
        onConfirm={() => void handleCloseRoom()}
        onCancel={() => setCloseTarget(null)}
      />
    </View>
  );
}
