import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import {
  LoungeAnonymousBadge,
  LoungeErrorBanner,
  LoungeMetaText,
  LoungeScreen,
  useLoungeListContentStyle,
} from '@/components/emsCommunity/loungeUi';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { ChatMessage } from '@/data/paramedicMockData';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { subscribeEmsChatRoomMessages } from '@/lib/realtimeSubscription';
import {
  fetchChatRoomMessages,
  formatEmsChatTimestamp,
  type EmsChatRoom,
} from '@/services/emsChatRoomService';

type EmsChatRoomViewProps = {
  room: EmsChatRoom;
  onBack: () => void;
};

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <View className="mb-3 px-1">
      <View className="mb-1 flex-row items-center justify-between">
        <LoungeAnonymousBadge label={message.anonymousLabel} />
        <View className="flex-row items-center">
          <LoungeMetaText>
            {formatEmsChatTimestamp(message.createdAt)}
          </LoungeMetaText>
          <View className="ml-2">
            <ReportContentButton
              contentId={message.id}
              contentType="chat"
              preview={message.content}
              compact
            />
          </View>
        </View>
      </View>
      <View
        className="self-start rounded-2xl rounded-tl-sm px-3 py-2.5"
        style={{
          maxWidth: '92%',
          backgroundColor: lounge.surface,
          borderWidth: 1,
          borderColor: lounge.border,
        }}
      >
        <RichContentRenderer content={message.content} tone="lounge" />
      </View>
    </View>
  );
}

export function EmsChatRoomView({ room, onBack }: EmsChatRoomViewProps) {
  const { lounge } = useEmsLoungeTheme();
  const loungeListContentStyle = useLoungeListContentStyle();
  const { postChatMessage } = useParamedicCommunity();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const rows = await fetchChatRoomMessages(room.id);
      setMessages(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [room.id]);

  useEffect(() => {
    setLoading(true);
    void loadMessages();

    const unsubscribe = subscribeEmsChatRoomMessages(room.id, () => {
      void loadMessages();
    });

    return unsubscribe;
  }, [room.id, loadMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  useHardwareBackHandler(() => {
    onBack();
    return true;
  });

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < 1) {
      Alert.alert('입력 부족', '메시지를 입력해 주세요.');
      return;
    }

    setSending(true);
    try {
      await postChatMessage(room.id, trimmed);
      setDraft('');
      await loadMessages();
    } catch (err) {
      Alert.alert(
        '전송 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSending(false);
    }
  };

  const headerMeta = [
    [room.category, room.region].filter(Boolean).join(' · '),
    `${room.participantCount}명 참여`,
    room.creatorLabel ? `개설 ${room.creatorLabel}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <LoungeScreen>
      <ParamedicHeader />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: lounge.border,
            backgroundColor: lounge.surface,
            paddingHorizontal: EMS_LOUNGE_SPACING.screen,
            paddingVertical: 12,
          }}
        >
          <View className="flex-row items-center">
            <Pressable className="mr-3 rounded-full p-1 active:opacity-80" onPress={onBack} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={lounge.text} />
            </Pressable>
            <View className="flex-1">
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: 'Pretendard-Bold',
                  fontSize: 16,
                  color: lounge.text,
                }}
              >
                {room.roomName}
              </Text>
              {headerMeta ? (
                <Text
                  className="mt-0.5"
                  style={{
                    fontFamily: 'Pretendard',
                    fontSize: 11,
                    color: lounge.textMuted,
                  }}
                >
                  {headerMeta}
                </Text>
              ) : null}
            </View>
          </View>
          {room.description ? (
            <Text
              className="mt-2 pl-9"
              style={{
                fontFamily: 'Pretendard',
                fontSize: 12,
                color: lounge.textSecondary,
              }}
            >
              {room.description}
            </Text>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{
            ...loungeListContentStyle,
            flexGrow: 1,
          }}
          ListHeaderComponent={error ? <LoungeErrorBanner message={error} /> : null}
          ListEmptyComponent={
            loading ? (
              <View className="flex-1 items-center justify-center py-16">
                <Text
                  style={{
                    fontFamily: 'Pretendard',
                    fontSize: 14,
                    color: lounge.textSecondary,
                  }}
                >
                  메시지를 불러오는 중…
                </Text>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-16">
                <Ionicons name="chatbubbles-outline" size={40} color={lounge.textMuted} />
                <Text
                  className="mt-3"
                  style={{
                    fontFamily: 'Pretendard',
                    fontSize: 14,
                    color: lounge.textSecondary,
                  }}
                >
                  첫 메시지를 남겨 보세요
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => <ChatMessageBubble message={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: lounge.border,
            backgroundColor: lounge.surface,
            paddingHorizontal: EMS_LOUNGE_SPACING.screen,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <View className="flex-row items-end gap-2">
            <TextInput
              style={{
                maxHeight: 96,
                flex: 1,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: lounge.border,
                backgroundColor: lounge.background,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontFamily: 'Pretendard',
                fontSize: 14,
                color: lounge.text,
              }}
              placeholder="메시지 입력 (개인정보·비방 금지)"
              placeholderTextColor={lounge.textMuted}
              value={draft}
              onChangeText={setDraft}
              multiline
              editable={!sending}
            />
            <Pressable
              className="active:opacity-90"
              style={{
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: sending ? lounge.surfaceElevated : lounge.accent,
              }}
              disabled={sending}
              onPress={() => void handleSend()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LoungeScreen>
  );
}
