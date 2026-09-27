import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  Text,
  UIManager,
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminChatRoomMessageMonitor } from '@/components/admin/panels/AdminChatRoomMessageMonitor';
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
import { hideEmsChatMessage } from '@/services/emsCommunityService';

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

export function AdminEmsChatRoomsPanel() {
  const [rooms, setRooms] = useState<EmsChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [messageSelectionMode, setMessageSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());
  const [deleteMessagesConfirmOpen, setDeleteMessagesConfirmOpen] = useState(false);
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

  const toggleMonitorPanel = () => {
    animatePanelToggle();
    setMonitorOpen((prev) => !prev);
  };

  const openMonitorPanel = () => {
    setMonitorOpen((prev) => {
      if (!prev) animatePanelToggle();
      return true;
    });
  };

  const clearMessageSelection = () => {
    setSelectedMessageIds(new Set());
    setMessageSelectionMode(false);
  };

  const selectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    clearMessageSelection();
    openMonitorPanel();
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const visibleMessages = useMemo(
    () =>
      [...messages].reverse().map((message) => ({
        id: message.id,
        anonymousLabel: message.anonymousLabel,
        content: message.content,
        timeLabel: message.postedAt,
      })),
    [messages],
  );

  const allVisibleSelected =
    visibleMessages.length > 0 && visibleMessages.every((m) => selectedMessageIds.has(m.id));

  const toggleSelectAllMessages = () => {
    if (allVisibleSelected) {
      setSelectedMessageIds(new Set());
      return;
    }
    setSelectedMessageIds(new Set(visibleMessages.map((m) => m.id)));
  };

  const reloadRooms = useCallback(async () => {
    try {
      const rows = await fetchActiveChatRooms();
      setRooms(rows);
      if (selectedRoomId && !rows.some((room) => room.id === selectedRoomId)) {
        setSelectedRoomId(null);
        setMessages([]);
        setSelectedMessageIds(new Set());
        setMessageSelectionMode(false);
      }
    } catch (error) {
      console.error('[AdminEmsChatRooms] reloadRooms failed', error);
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
      openMonitorPanel();
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
      clearMessageSelection();
    }

    try {
      await adminDeactivateChatRoom(roomId);
      await reloadRooms();
      Alert.alert('완료', `"${roomName}" 채팅방이 폐쇄되었습니다.`);
    } catch (error) {
      console.error('[AdminEmsChatRooms] handleCloseRoom failed', { roomId, roomName, error });
      await reloadRooms();
      Alert.alert('실패', error instanceof Error ? error.message : '폐쇄에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSelectedMessages = async () => {
    const ids = [...selectedMessageIds];
    if (ids.length === 0) {
      setDeleteMessagesConfirmOpen(false);
      return;
    }

    setSubmitting(true);
    setDeleteMessagesConfirmOpen(false);
    try {
      const results = await Promise.allSettled(ids.map((id) => hideEmsChatMessage(id)));
      const deletedIds = ids.filter((_, index) => results[index].status === 'fulfilled');
      const failCount = results.length - deletedIds.length;

      if (deletedIds.length > 0) {
        setMessages((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
        setSelectedMessageIds((prev) => {
          const next = new Set(prev);
          deletedIds.forEach((id) => next.delete(id));
          return next;
        });
      }

      if (failCount > 0) {
        Alert.alert(
          '일부 삭제 실패',
          `${deletedIds.length}건 삭제, ${failCount}건 실패했습니다. 권한·네트워크를 확인해 주세요.`,
        );
      } else {
        Alert.alert('완료', `${deletedIds.length}건의 메시지를 삭제했습니다.`);
        if (deletedIds.length === ids.length) clearMessageSelection();
      }

      if (selectedRoomId) await reloadMessages(selectedRoomId);
    } catch (error) {
      Alert.alert('삭제 실패', error instanceof Error ? error.message : '메시지 삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const listMaxHeight = useMemo(() => {
    if (createFormOpen && monitorOpen) return 140;
    if (createFormOpen || monitorOpen) return 200;
    return 320;
  }, [createFormOpen, monitorOpen]);

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
        className="flex-row items-center justify-between rounded-xl border border-violet-200 bg-kemix-surface px-4 py-3 active:bg-violet-50"
        onPress={toggleCreateForm}
      >
        <Text className="text-sm font-bold text-violet-800">+ 대원 채팅방 개설하기</Text>
        <Ionicons name={createFormOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6d28d9" />
      </Pressable>

      {createFormOpen ? (
        <View className="mt-2 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <Text className="mb-1 text-sm font-bold text-violet-900">EMS 채팅방 생성</Text>
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

      <Text className="mb-2 mt-3 text-sm font-bold text-kemix-text">대원 채팅방 목록 · 모니터링</Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        style={{ flexGrow: 0, maxHeight: listMaxHeight }}
        contentContainerStyle={{ paddingBottom: 4 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="py-6 text-center text-sm text-kemix-text-secondary">등록된 채팅방이 없습니다.</Text>
        }
        renderItem={({ item }) => {
          const active = selectedRoomId === item.id;
          return (
            <View
              className={`mb-2 rounded-xl border p-3 ${active ? 'border-violet-400 bg-violet-50' : 'border-kemix-border bg-kemix-surface'}`}
            >
              <Pressable onPress={() => selectRoom(item.id)}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="font-semibold text-kemix-text">{item.roomName}</Text>
                    <Text className="mt-0.5 text-xs text-kemix-text-secondary">
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

      <AdminChatRoomMessageMonitor
        monitorOpen={monitorOpen}
        onToggleMonitor={toggleMonitorPanel}
        monitorHeaderTitle={
          selectedRoom ? `${selectedRoom.roomName} · 대화 모니터링` : '채팅방을 선택하세요'
        }
        selectedRoomId={selectedRoomId}
        emptyRoomHint="위 목록에서 채팅방을 선택하면 대화 내용을 확인할 수 있습니다."
        messagesLoading={messagesLoading}
        visibleMessages={visibleMessages}
        submitting={submitting}
        messageSelectionMode={messageSelectionMode}
        selectedMessageIds={selectedMessageIds}
        onEnterSelectionMode={() => setMessageSelectionMode(true)}
        onClearMessageSelection={clearMessageSelection}
        onToggleSelectAll={toggleSelectAllMessages}
        allVisibleSelected={allVisibleSelected}
        onToggleMessageSelection={toggleMessageSelection}
        onOpenDeleteConfirm={() => setDeleteMessagesConfirmOpen(true)}
      />

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

      <AdminConfirmModal
        visible={deleteMessagesConfirmOpen}
        title="메시지 삭제"
        message={`선택한 ${selectedMessageIds.size}건의 메시지를 삭제(숨김)하시겠습니까? 사용자 채팅방에서도 보이지 않습니다.`}
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onConfirm={() => void handleDeleteSelectedMessages()}
        onCancel={() => setDeleteMessagesConfirmOpen(false)}
      />
    </View>
  );
}
