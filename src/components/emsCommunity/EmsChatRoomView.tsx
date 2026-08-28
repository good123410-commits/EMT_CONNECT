import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Alert, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { ShortcodeComposerField } from '@/components/content/ShortcodeComposerField';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { APP_SPACING } from '@/constants/appTheme';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { ChatMessage } from '@/data/paramedicMockData';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import {
  bootstrapEmsChatRoomParticipation,
  setActiveEmsChatRoomForNotifications,
} from '@/contexts/PushNotificationContext';
import { subscribeEmsChatRoomMessages } from '@/lib/realtimeSubscription';
import {
  fetchChatRoomMessages,
  formatEmsChatTimestamp,
  type EmsChatRoom,
} from '@/services/emsChatRoomService';
import { parseNicknameError } from '@/utils/userNickname';

type EmsChatRoomViewProps = {
  room: EmsChatRoom;
  onBack: () => void;
};

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-3 px-1">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
          {message.anonymousLabel}
        </Text>
        <View className="flex-row items-center">
          <Text className="mr-2 text-[10px]" style={{ color: colors.metaText }}>
            {formatEmsChatTimestamp(message.createdAt)}
          </Text>
          <ReportContentButton
            contentId={message.id}
            contentType="chat"
            preview={message.content}
            compact
          />
        </View>
      </View>
      <View
        className="self-start rounded-2xl rounded-tl-sm px-3 py-2.5"
        style={{
          maxWidth: '92%',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <RichContentRenderer content={message.content} tone="community" />
      </View>
    </View>
  );
}

export function EmsChatRoomView({ room, onBack }: EmsChatRoomViewProps) {
  const { colors } = useAppTheme();
  const fabBottomInset = useGlobalFabBottomInset();
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
    void bootstrapEmsChatRoomParticipation(room.id);
    setActiveEmsChatRoomForNotifications(room.id);

    const unsubscribe = subscribeEmsChatRoomMessages(room.id, () => {
      void loadMessages();
    });

    return () => {
      setActiveEmsChatRoomForNotifications(null);
      unsubscribe();
    };
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
      Alert.alert('전송 실패', parseNicknameError(err));
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

  const composerBottomPadding = Math.max(12, fabBottomInset - 48);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        className="border-b px-4 py-3"
        style={{
          borderBottomColor: colors.borderLight,
          backgroundColor: colors.surface,
        }}
      >
        <View className="flex-row items-center">
          <Pressable className="mr-3 rounded-full p-1 active:opacity-80" onPress={onBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-base font-bold" numberOfLines={1} style={{ color: colors.textPrimary }}>
              {room.roomName}
            </Text>
            {headerMeta ? (
              <Text className="mt-0.5 text-[11px]" style={{ color: colors.metaText }}>
                {headerMeta}
              </Text>
            ) : null}
          </View>
        </View>
        {room.description ? (
          <Text className="mt-2 pl-9 text-xs" style={{ color: colors.textSecondary }}>
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
          paddingHorizontal: APP_SPACING.contentHorizontal,
          paddingTop: 12,
          paddingBottom: 12,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          error ? (
            <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                메시지를 불러오는 중…
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-16">
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
              <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
                첫 메시지를 남겨 보세요
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <ChatMessageBubble message={item} />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View
        className="border-t px-4 pt-3"
        style={{
          borderTopColor: colors.borderLight,
          backgroundColor: colors.surface,
          paddingBottom: composerBottomPadding,
        }}
      >
        <View className="flex-row items-end gap-2">
          <ShortcodeComposerField
            value={draft}
            onChangeText={setDraft}
            inputProps={{
              className: 'max-h-24 flex-1 rounded-2xl border px-3 py-2.5 text-sm',
              style: {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.textPrimary,
              },
              placeholder: '메시지 입력 (개인정보·비방 금지)',
              placeholderTextColor: colors.textMuted,
              multiline: true,
              editable: !sending,
            }}
          />
          <Pressable
            className="rounded-xl px-4 py-3 active:opacity-90"
            style={{ backgroundColor: sending ? colors.border : colors.blue }}
            disabled={sending}
            onPress={() => void handleSend()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
