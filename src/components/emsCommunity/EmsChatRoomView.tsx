import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Alert, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { ChatMessageContextMenu } from '@/components/chat/ChatMessageContextMenu';
import { ChatMessageRow } from '@/components/chat/ChatMessageRow';
import { ShortcodeComposerField } from '@/components/content/ShortcodeComposerField';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { APP_SPACING } from '@/constants/appTheme';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import type { ChatMessage } from '@/data/paramedicMockData';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useChatRoomReactions } from '@/hooks/useChatRoomReactions';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
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
import { hideEmsChatMessage } from '@/services/emsCommunityService';
import type { ChatContextMenuMessage } from '@/types/chatReactions';
import { buildChatReplyDraft, resolveChatMessageAuthorId, showChatAlert, stripChatContentForCopy } from '@/utils/chatMessageActions';
import { isPostAuthor } from '@/utils/communityPostAccess';
import { parseNicknameError } from '@/utils/userNickname';

type EmsChatRoomViewProps = {
  room: EmsChatRoom;
  onBack: () => void;
};

export function EmsChatRoomView({ room, onBack }: EmsChatRoomViewProps) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const fabBottomInset = useGlobalFabBottomInset();
  const { postChatMessage } = useParamedicCommunity();
  const { isDbAdmin } = useLiveDbAdmin();
  const { filterBlocked, reload: reloadBlockedUsers } = useBlockedUsers();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [contextMenuMessage, setContextMenuMessage] = useState<ChatContextMenuMessage | null>(null);
  const [replyTarget, setReplyTarget] = useState<ChatContextMenuMessage | null>(null);
  const { reactionsByMessageId, toggleReaction } = useChatRoomReactions('ems_chat', room.id);

  const visibleMessages = useMemo(() => filterBlocked(messages), [filterBlocked, messages]);

  const canDeleteMessage = useCallback(
    (authorId?: string | null) => isDbAdmin || isPostAuthor(authorId, user?.id),
    [isDbAdmin, user?.id],
  );

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
    if (visibleMessages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [visibleMessages.length]);

  useHardwareBackHandler(() => {
    onBack();
    return true;
  });

  const handleDeleteMessage = async (message: ChatContextMenuMessage) => {
    if (!user) {
      showChatAlert('로그인 필요', '메시지를 삭제하려면 로그인해 주세요.');
      return;
    }

    const authorId = resolveChatMessageAuthorId(message, messages);
    if (!canDeleteMessage(authorId)) {
      showChatAlert('권한 없음', '본인 메시지 또는 관리자만 삭제할 수 있습니다.');
      return;
    }

    try {
      await hideEmsChatMessage(message.id);
      setMessages((prev) => prev.filter((item) => item.id !== message.id));
      showChatAlert('삭제 완료', '메시지가 삭제되었습니다.');
    } catch (err) {
      showChatAlert(
        '삭제 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < 1) {
      Alert.alert('입력 부족', '메시지를 입력해 주세요.');
      return;
    }

    const contentToSend = replyTarget
      ? `${buildChatReplyDraft(replyTarget.content, replyTarget.anonymousLabel)}${trimmed}`
      : trimmed;

    setSending(true);
    try {
      await postChatMessage(room.id, contentToSend);
      setDraft('');
      setReplyTarget(null);
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
        data={visibleMessages}
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
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ChatMessageRow
            id={item.id}
            content={item.content}
            anonymousLabel={item.anonymousLabel}
            authorId={item.authorId}
            timestampLabel={formatEmsChatTimestamp(item.createdAt)}
            headerRight={
              <ReportContentButton
                contentId={item.id}
                contentType="chat"
                preview={item.content}
                compact
              />
            }
            reactionSummary={reactionsByMessageId[item.id]}
            onOpenContextMenu={() =>
              setContextMenuMessage({
                id: item.id,
                content: item.content,
                anonymousLabel: item.anonymousLabel,
                authorId: item.authorId,
              })
            }
            onToggleReaction={toggleReaction}
            onAuthorBlocked={() => {
              void reloadBlockedUsers();
              void loadMessages();
            }}
          />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View
        className="border-t"
        style={{
          borderTopColor: colors.borderLight,
          backgroundColor: colors.surface,
        }}
      >
        {replyTarget ? (
          <View
            className="flex-row items-center border-b px-4 py-2.5"
            style={{ borderBottomColor: colors.borderLight, backgroundColor: colors.background }}
          >
            <View className="mr-3 flex-1">
              <Text className="text-xs font-semibold" style={{ color: colors.blue }}>
                {replyTarget.anonymousLabel}에게 답장
              </Text>
              <Text className="mt-0.5 text-xs" numberOfLines={1} style={{ color: colors.textSecondary }}>
                {stripChatContentForCopy(replyTarget.content)}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={() => setReplyTarget(null)}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        <View className="px-4 pt-3" style={{ paddingBottom: composerBottomPadding }}>
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
                placeholder: replyTarget ? '답장 입력…' : '메시지 입력 (개인정보·비방 금지)',
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
      </View>

      <ChatMessageContextMenu
        visible={contextMenuMessage !== null}
        message={contextMenuMessage}
        summary={contextMenuMessage ? reactionsByMessageId[contextMenuMessage.id] : undefined}
        canDelete={
          contextMenuMessage
            ? canDeleteMessage(resolveChatMessageAuthorId(contextMenuMessage, messages))
            : false
        }
        onClose={() => setContextMenuMessage(null)}
        onToggleReaction={toggleReaction}
        onReply={setReplyTarget}
        onDelete={(message) => {
          void handleDeleteMessage(message);
        }}
      />
    </KeyboardAvoidingView>
  );
}
