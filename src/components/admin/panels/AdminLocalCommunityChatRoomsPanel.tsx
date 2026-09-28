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
import { KoreanRegionSelector, KoreanRegionTitle } from '@/components/utilities/KoreanRegionSelector';
import { KOREAN_SIGUNGU_UNITS } from '@/constants/koreanRegions';
import {
  adminCreateLocalCommunityRoom,
  adminDeactivateLocalCommunityRoom,
  adminFetchLocalCommunityMessages,
  deleteLocalCommunityMessage,
  fetchLocalCommunityRooms,
  formatChatTimestamp,
  subscribeLocalCommunityRoomList,
  subscribeLocalCommunityRoomMessages,
} from '@/services/localCommunityChatService';
import type { LocalCommunityRoom } from '@/types/localCommunity';
import type { LocalCommunityCategory, LocalCommunityMessage } from '@/types/localCommunity';
import {
  LOCAL_COMMUNITY_CATEGORIES,
  LOCAL_COMMUNITY_CATEGORY_LABELS,
} from '@/types/localCommunity';
import { getRegionUnitByCode } from '@/utils/koreanRegionResolver';

const EMPTY_FORM = {
  title: '',
  topic: '',
  category: 'pediatric_wait' as LocalCommunityCategory,
  description: '',
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animatePanelToggle() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export function AdminLocalCommunityChatRoomsPanel() {
  const [regionCode, setRegionCode] = useState<string>(() => KOREAN_SIGUNGU_UNITS[0]?.code ?? '');
  const [rooms, setRooms] = useState<LocalCommunityRoom[]>([]);
  const [messages, setMessages] = useState<LocalCommunityMessage[]>([]);
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
  const [closeTarget, setCloseTarget] = useState<LocalCommunityRoom | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const regionUnit = useMemo(() => getRegionUnitByCode(regionCode), [regionCode]);

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
        timeLabel: formatChatTimestamp(message.createdAt),
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
    if (!regionCode) {
      setLoading(false);
      return;
    }
    try {
      const rows = await fetchLocalCommunityRooms(regionCode);
      setRooms(rows);
      setSelectedRoomId((current) => {
        if (current && !rows.some((room) => room.id === current)) {
          setMessages([]);
          setSelectedMessageIds(new Set());
          setMessageSelectionMode(false);
          return null;
        }
        return current;
      });
    } catch (error) {
      console.error('[AdminLocalCommunity] reloadRooms failed', error);
      Alert.alert('조회 실패', error instanceof Error ? error.message : '채팅방을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [regionCode]);

  const reloadMessages = useCallback(async (roomId: string) => {
    setMessagesLoading(true);
    try {
      const rows = await adminFetchLocalCommunityMessages(roomId);
      setMessages(rows);
    } catch (error) {
      Alert.alert('조회 실패', error instanceof Error ? error.message : '메시지를 불러올 수 없습니다.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedRoomId(null);
    setMessages([]);
    setSelectedMessageIds(new Set());
    setMessageSelectionMode(false);
    setLoading(true);
  }, [regionCode]);

  useEffect(() => {
    void reloadRooms();
    const unsubscribe = subscribeLocalCommunityRoomList(regionCode, () => {
      void reloadRooms();
    });
    return unsubscribe;
  }, [regionCode, reloadRooms]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }
    void reloadMessages(selectedRoomId);
    const unsubscribe = subscribeLocalCommunityRoomMessages(selectedRoomId, () => {
      void reloadMessages(selectedRoomId);
    });
    return unsubscribe;
  }, [selectedRoomId, reloadMessages]);

  const handleRegionChange = (code: string) => {
    setRegionCode(code);
  };

  const handleCreateRoom = async () => {
    if (!regionCode) {
      Alert.alert('지역 필요', '시·군·구를 선택해 주세요.');
      return;
    }
    if (!form.title.trim()) {
      Alert.alert('입력 필요', '채팅방 제목을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const room = await adminCreateLocalCommunityRoom({
        regionCode,
        title: form.title.trim(),
        topic: form.topic.trim() || undefined,
        category: form.category,
        description: form.description.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      setSelectedRoomId(room.id);
      openMonitorPanel();
      animatePanelToggle();
      setCreateFormOpen(false);
      await reloadRooms();
      Alert.alert('완료', `"${room.title}" 채팅방이 생성되었습니다.`);
    } catch (error) {
      Alert.alert('실패', error instanceof Error ? error.message : '생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!closeTarget) return;
    const roomId = closeTarget.id;
    const roomTitle = closeTarget.title;

    setSubmitting(true);
    setCloseTarget(null);
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      setMessages([]);
      clearMessageSelection();
    }

    try {
      await adminDeactivateLocalCommunityRoom(roomId);
      await reloadRooms();
      Alert.alert('완료', `"${roomTitle}" 채팅방이 폐쇄되었습니다.`);
    } catch (error) {
      console.error('[AdminLocalCommunity] handleCloseRoom failed', { roomId, roomTitle, error });
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
      const results = await Promise.allSettled(ids.map((id) => deleteLocalCommunityMessage(id)));
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

  const listMaxHeight = useMemo(() => (createFormOpen ? 200 : 280), [createFormOpen]);

  if (loading && !regionCode) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {regionUnit ? <KoreanRegionTitle unit={regionUnit} /> : null}
      <KoreanRegionSelector selectedCode={regionCode} onSelect={handleRegionChange} />

      <Pressable
        className="mt-3 flex-row items-center justify-between rounded-xl border border-teal-200 bg-kemix-surface px-4 py-3 active:bg-teal-50"
        onPress={toggleCreateForm}
      >
        <Text className="text-sm font-bold text-teal-800">+ 우리동네토크 방 개설하기</Text>
        <Ionicons name={createFormOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#0f766e" />
      </Pressable>

      {createFormOpen ? (
        <View className="mt-2 overflow-hidden rounded-2xl border border-teal-200 bg-teal-50/80 p-4">
          <Text className="mb-1 text-sm font-bold text-teal-900">우리동네토크 채팅방 생성</Text>
          <Text className="mb-2 text-xs text-teal-800">
            선택 지역: {getRegionUnitByCode(regionCode)?.displayName ?? regionCode}
          </Text>
          <AdminFormField
            label="방 제목"
            value={form.title}
            onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
            placeholder="채팅방 제목 (2자 이상)"
          />
          <AdminFormField
            label="주제 태그"
            value={form.topic}
            onChangeText={(value) => setForm((prev) => ({ ...prev, topic: value }))}
            placeholder="선택 입력"
          />
          <Text className="mb-2 text-xs font-semibold text-kemix-text">카테고리</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {LOCAL_COMMUNITY_CATEGORIES.map((category) => {
              const active = form.category === category;
              return (
                <Pressable
                  key={category}
                  className={`rounded-full px-3 py-1.5 ${active ? 'bg-teal-700' : 'bg-white border border-teal-200'}`}
                  onPress={() => setForm((prev) => ({ ...prev, category }))}
                >
                  <Text className={`text-[11px] font-bold ${active ? 'text-white' : 'text-teal-800'}`}>
                    {LOCAL_COMMUNITY_CATEGORY_LABELS[category]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <AdminFormField
            label="설명"
            value={form.description}
            onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
            placeholder="안내 문구"
            multiline
          />
          <Pressable
            className={`items-center rounded-xl py-3 ${submitting ? 'bg-teal-300' : 'bg-teal-700'}`}
            disabled={submitting}
            onPress={() => void handleCreateRoom()}
          >
            <Text className="font-bold text-white">{submitting ? '생성 중...' : '채팅방 생성'}</Text>
          </Pressable>
        </View>
      ) : null}

      <Text className="mb-2 mt-3 text-sm font-bold text-kemix-text">우리동네토크 목록 · 모니터링</Text>

      {loading ? (
        <ActivityIndicator color="#0d9488" className="py-6" />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          style={{ flexGrow: 0, maxHeight: listMaxHeight }}
          contentContainerStyle={{ paddingBottom: 4 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="py-6 text-center text-sm text-kemix-text-secondary">
              이 지역에 등록된 채팅방이 없습니다.
            </Text>
          }
          renderItem={({ item }) => {
            const active = selectedRoomId === item.id;
            const categoryLabel = item.category ? LOCAL_COMMUNITY_CATEGORY_LABELS[item.category] : null;
            return (
              <View
                className={`mb-2 rounded-xl border p-3 ${active ? 'border-teal-400 bg-teal-50' : 'border-kemix-border bg-kemix-surface'}`}
              >
                <Pressable onPress={() => selectRoom(item.id)}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="font-semibold text-kemix-text">{item.title}</Text>
                      <Text className="mt-0.5 text-xs text-kemix-text-secondary">
                        {[categoryLabel, item.topic].filter(Boolean).join(' · ') || '분류 없음'}
                      </Text>
                      <Text className="mt-0.5 text-[10px] text-kemix-muted">
                        메시지 {item.messageCount} · 참여 {item.participantCount}
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
      )}

      <AdminChatRoomMessageMonitor
        monitorOpen={monitorOpen}
        onToggleMonitor={toggleMonitorPanel}
        monitorHeaderTitle={
          selectedRoom ? `${selectedRoom.title} · 대화 모니터링` : '채팅방을 선택하세요'
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
        message={`"${closeTarget?.title}" 우리동네토크 방을 폐쇄하시겠습니까?`}
        confirmLabel="폐쇄"
        destructive
        loading={submitting}
        onConfirm={() => void handleCloseRoom()}
        onCancel={() => setCloseTarget(null)}
      />

      <AdminConfirmModal
        visible={deleteMessagesConfirmOpen}
        title="메시지 삭제"
        message={`선택한 ${selectedMessageIds.size}건의 메시지를 삭제(숨김)하시겠습니까? 우리동네토크에서도 보이지 않습니다.`}
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onConfirm={() => void handleDeleteSelectedMessages()}
        onCancel={() => setDeleteMessagesConfirmOpen(false)}
      />
    </View>
  );
}
