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
import {
  LoungeAnonymousBadge,
  LoungeBody,
  LoungeCard,
  LoungeErrorBanner,
  LoungeFilterPill,
  LoungeFilterRow,
  LoungeIconAction,
  LoungeMetaText,
  LoungePrimaryButton,
  LoungeScreen,
  LoungeTopSection,
  loungeListContent,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { EMS_LOUNGE, EMS_LOUNGE_SHADOW, EMS_LOUNGE_SPACING } from '@/constants/emsLoungeTheme';
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
    <LoungeCard>
      <View className="flex-row items-center justify-between">
        <LoungeAnonymousBadge label={message.anonymousLabel} />
        <LoungeMetaText>{message.postedAt}</LoungeMetaText>
      </View>
      <View className="mt-3">
        <LoungeBody>{message.content}</LoungeBody>
      </View>
      <View className="mt-3 flex-row justify-end">
        <ReportContentButton
          contentId={message.id}
          contentType="chat"
          preview={message.content}
          compact
        />
      </View>
    </LoungeCard>
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
    <LoungeFilterPill label={room.roomName} active={active} onPress={onPress} />
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
    <LoungeScreen>
      <ParamedicHeader />

      <LoungeTopSection>
        <View className="flex-row items-center justify-between pb-3">
          <Text
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 13,
              color: EMS_LOUNGE.textSecondary,
            }}
          >
            채팅방 선택
          </Text>
          {canManageRooms ? (
            <LoungeIconAction
              icon="add"
              accessibilityLabel="채팅방 만들기"
              onPress={() => setFormVisible(true)}
            />
          ) : null}
        </View>
        {chatRoomsLoading ? (
          <ActivityIndicator color={EMS_LOUNGE.accent} className="py-3" />
        ) : chatRooms.length === 0 ? (
          <Text
            style={{
              fontFamily: 'Pretendard',
              fontSize: 14,
              color: EMS_LOUNGE.textSecondary,
              paddingVertical: 8,
            }}
          >
            열린 채팅방이 없습니다.{canManageRooms ? ' + 버튼으로 생성해 주세요.' : ''}
          </Text>
        ) : (
          <LoungeFilterRow>
            {chatRooms.map((item) => (
              <RoomTab
                key={item.id}
                room={item}
                active={roomId === item.id}
                onPress={() => setRoomId(item.id)}
              />
            ))}
          </LoungeFilterRow>
        )}
        {selectedRoom ? (
          <Text
            style={{
              marginTop: 8,
              fontFamily: 'Pretendard',
              fontSize: 12,
              color: EMS_LOUNGE.textMuted,
            }}
          >
            {[selectedRoom.region, selectedRoom.category].filter(Boolean).join(' · ') ||
              selectedRoom.description ||
              '익명 소통'}
            {selectedRoom.description ? ` — ${selectedRoom.description}` : ''}
          </Text>
        ) : null}
      </LoungeTopSection>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={roomMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={loungeListContent}
          ListHeaderComponent={error ? <LoungeErrorBanner message={error} /> : null}
          ListEmptyComponent={
            !roomId ? (
              <View className="items-center py-16">
                <Ionicons name="chatbubbles-outline" size={40} color={EMS_LOUNGE.textMuted} />
                <Text
                  style={{
                    marginTop: 12,
                    fontFamily: 'Pretendard',
                    fontSize: 14,
                    color: EMS_LOUNGE.textSecondary,
                  }}
                >
                  채팅방을 선택해 주세요
                </Text>
              </View>
            ) : loading ? (
              <View className="items-center py-16">
                <ActivityIndicator color={EMS_LOUNGE.accent} />
              </View>
            ) : (
              <View className="items-center py-16">
                <Ionicons name="chatbubbles-outline" size={40} color={EMS_LOUNGE.textMuted} />
                <Text
                  style={{
                    marginTop: 12,
                    fontFamily: 'Pretendard',
                    fontSize: 14,
                    color: EMS_LOUNGE.textSecondary,
                  }}
                >
                  아직 메시지가 없습니다
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => <ChatBubble message={item} />}
        />

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: EMS_LOUNGE.border,
            backgroundColor: EMS_LOUNGE.surface,
            paddingHorizontal: EMS_LOUNGE_SPACING.screen,
            paddingVertical: 12,
          }}
        >
          <View className="flex-row items-end gap-2">
            <TextInput
              style={{
                maxHeight: 96,
                flex: 1,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: EMS_LOUNGE.border,
                backgroundColor: EMS_LOUNGE.background,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontFamily: 'Pretendard',
                fontSize: 14,
                color: EMS_LOUNGE.text,
              }}
              placeholder={
                roomId ? '익명 메시지 (개인정보·비방 금지)' : '채팅방을 먼저 선택해 주세요'
              }
              placeholderTextColor={EMS_LOUNGE.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              editable={Boolean(roomId)}
            />
            <Pressable
              className="active:opacity-90"
              style={{
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: roomId ? EMS_LOUNGE.accent : EMS_LOUNGE.surfaceElevated,
                ...EMS_LOUNGE_SHADOW.cardSoft,
              }}
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
          className="flex-1"
          style={{ backgroundColor: EMS_LOUNGE.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text
              style={{
                marginBottom: 16,
                fontFamily: 'Pretendard-Bold',
                fontSize: 18,
                color: EMS_LOUNGE.text,
              }}
            >
              새 채팅방 만들기
            </Text>
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
            <LoungePrimaryButton
              label={submitting ? '생성 중...' : '채팅방 생성'}
              onPress={() => void handleCreateRoom()}
            />
            <Pressable className="mt-3 items-center py-2" onPress={() => setFormVisible(false)}>
              <Text
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 14,
                  color: EMS_LOUNGE.textMuted,
                }}
              >
                취소
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </LoungeScreen>
  );
}
