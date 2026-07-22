import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { ChatMessage } from '@/data/paramedicMockData';
import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { EmsChatRoom } from '@/services/emsChatRoomService';

const EMPTY_ROOM_FORM = {
  roomName: '',
  region: '',
  category: '',
  description: '',
};

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-slate-800">{message.anonymousLabel}</Text>
        <Text className="text-xs text-slate-400">{message.postedAt}</Text>
      </View>
      <Text className="mt-2 text-sm leading-6 text-slate-700">{message.content}</Text>
      <View className="mt-3 flex-row justify-end border-t border-slate-100 pt-2">
        <ReportContentButton
          contentId={message.id}
          contentType="chat"
          preview={message.content}
          compact
        />
      </View>
    </View>
  );
}

function RoomTab({
  room,
  active,
  onPress,
}: {
  room: EmsChatRoom;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl px-4 py-2 ${active ? 'bg-green-700' : 'bg-slate-100'}`}
    >
      <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-600'}`}>
        {room.roomName}
      </Text>
    </Pressable>
  );
}

export function EmsChatRoomsScreen() {
  const {
    chatMessages,
    chatRooms,
    chatRoomsLoading,
    postChatMessage,
    createChatRoom,
    loading,
    error,
  } = useParamedicCommunity();
  const { isDbAdmin, opsAdminVerified } = useExpertSettingsAccess();
  const canManageRooms = isDbAdmin || opsAdminVerified;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_ROOM_FORM);
  const [submitting, setSubmitting] = useState(false);

  const selectedRoom = useMemo(
    () => chatRooms.find((room) => room.id === roomId) ?? null,
    [chatRooms, roomId],
  );

  useEffect(() => {
    if (chatRooms.length === 0) {
      setRoomId(null);
      return;
    }
    if (!roomId || !chatRooms.some((room) => room.id === roomId)) {
      setRoomId(chatRooms[0].id);
    }
  }, [chatRooms, roomId]);

  useEffect(() => {
    if (!roomId) return;
    const stillActive = chatRooms.some((room) => room.id === roomId);
    if (!stillActive) {
      Alert.alert('채팅방 폐쇄', '관리자에 의해 이 채팅방이 폐쇄되었습니다.');
      setRoomId(chatRooms[0]?.id ?? null);
      setDraft('');
    }
  }, [chatRooms, roomId]);

  useHardwareBackHandler(() => {
    if (formVisible) {
      setFormVisible(false);
      return true;
    }
    return false;
  }, formVisible);

  const roomMessages = useMemo(
    () => (roomId ? chatMessages.filter((m) => m.roomId === roomId) : []),
    [chatMessages, roomId],
  );

  const handleSend = async () => {
    if (!roomId) return;
    const trimmed = draft.trim();
    if (trimmed.length < 2) {
      Alert.alert('입력 부족', '메시지를 입력해 주세요.');
      return;
    }
    try {
      await postChatMessage(roomId, trimmed);
      setDraft('');
    } catch (err) {
      Alert.alert(
        '전송 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleCreateRoom = async () => {
    if (form.roomName.trim().length < 2) {
      Alert.alert('입력 부족', '채팅방 이름을 2자 이상 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const room = await createChatRoom({
        roomName: form.roomName.trim(),
        region: form.region.trim() || undefined,
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setFormVisible(false);
      setForm(EMPTY_ROOM_FORM);
      setRoomId(room.id);
      Alert.alert('생성 완료', `"${room.roomName}" 채팅방이 열렸습니다.`);
    } catch (err) {
      Alert.alert('생성 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100">
      <ParamedicHeader subtitle="소통창구 · 동적 챗방" />

      <View className="border-b border-slate-200 bg-white px-2 py-2">
        <View className="flex-row items-center justify-between px-2 pb-2">
          <Text className="text-xs font-semibold text-slate-500">채팅방 선택</Text>
          {canManageRooms ? (
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-full bg-green-700"
              onPress={() => setFormVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          ) : null}
        </View>
        {chatRoomsLoading ? (
          <ActivityIndicator color="#15803d" className="py-3" />
        ) : chatRooms.length === 0 ? (
          <Text className="px-3 py-3 text-sm text-slate-500">
            열린 채팅방이 없습니다.{canManageRooms ? ' + 버튼으로 생성해 주세요.' : ''}
          </Text>
        ) : (
          <FlatList
            horizontal
            data={chatRooms}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-2"
            renderItem={({ item }) => (
              <RoomTab
                room={item}
                active={roomId === item.id}
                onPress={() => setRoomId(item.id)}
              />
            )}
          />
        )}
        {selectedRoom ? (
          <Text className="px-3 pb-1 text-xs text-slate-500">
            {[selectedRoom.region, selectedRoom.category].filter(Boolean).join(' · ') ||
              selectedRoom.description ||
              '익명 소통'}
            {selectedRoom.description ? ` — ${selectedRoom.description}` : ''}
          </Text>
        ) : null}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={roomMessages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-4"
          ListHeaderComponent={
            error ? (
              <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-700">{error}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !roomId ? (
              <View className="items-center py-16">
                <Ionicons name="chatbubbles-outline" size={40} color="#94a3b8" />
                <Text className="mt-3 text-sm text-slate-500">채팅방을 선택해 주세요</Text>
              </View>
            ) : loading ? (
              <View className="items-center py-16">
                <ActivityIndicator color="#15803d" />
              </View>
            ) : (
              <View className="items-center py-16">
                <Ionicons name="chatbubbles-outline" size={40} color="#94a3b8" />
                <Text className="mt-3 text-sm text-slate-500">아직 메시지가 없습니다</Text>
              </View>
            )
          }
          renderItem={({ item }) => <ChatBubble message={item} />}
        />

        <View className="border-t border-slate-200 bg-white px-4 py-3">
          <View className="flex-row items-end gap-2">
            <TextInput
              className="max-h-24 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              placeholder={
                roomId ? '익명 메시지 (개인정보·비방 금지)' : '채팅방을 먼저 선택해 주세요'
              }
              value={draft}
              onChangeText={setDraft}
              multiline
              editable={Boolean(roomId)}
            />
            <Pressable
              className={`rounded-xl px-4 py-3 ${roomId ? 'bg-green-700' : 'bg-slate-300'}`}
              disabled={!roomId}
              onPress={() => void handleSend()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={formVisible} animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView
          className="flex-1 bg-slate-50"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerClassName="p-4 pb-10">
            <Text className="mb-4 text-lg font-bold text-slate-900">새 채팅방 만들기</Text>
            <AdminFormField
              label="방 이름"
              value={form.roomName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, roomName: value }))}
              placeholder="예: 강원 현장 소통방"
            />
            <AdminFormField
              label="지역"
              value={form.region}
              onChangeText={(value) => setForm((prev) => ({ ...prev, region: value }))}
              placeholder="예: 강원특별자치도"
            />
            <AdminFormField
              label="주제/분류"
              value={form.category}
              onChangeText={(value) => setForm((prev) => ({ ...prev, category: value }))}
              placeholder="예: 지역, 주제, 행사"
            />
            <AdminFormField
              label="설명"
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="채팅방 안내 문구"
              multiline
            />
            <Pressable
              className={`items-center rounded-xl py-3 ${submitting ? 'bg-green-300' : 'bg-green-700'}`}
              disabled={submitting}
              onPress={() => void handleCreateRoom()}
            >
              <Text className="font-bold text-white">{submitting ? '생성 중...' : '채팅방 생성'}</Text>
            </Pressable>
            <Pressable className="mt-3 items-center py-2" onPress={() => setFormVisible(false)}>
              <Text className="font-semibold text-slate-500">취소</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
