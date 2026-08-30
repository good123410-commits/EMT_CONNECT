import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Alert, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { ChatMessageContextMenu } from '@/components/chat/ChatMessageContextMenu';
import { ChatMessageRow } from '@/components/chat/ChatMessageRow';
import { ShortcodeComposerField } from '@/components/content/ShortcodeComposerField';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { APP_SPACING } from '@/constants/appTheme';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { useChatRoomReactions } from '@/hooks/useChatRoomReactions';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import { useLiveDbAdmin } from '@/hooks/useLiveDbAdmin';
import {
  bootstrapLocalChatRoomParticipation,
  setActiveLocalChatRoomForNotifications,
} from '@/contexts/PushNotificationContext';
import {
  deleteLocalCommunityMessage,
  fetchLocalCommunityMessages,
  formatChatTimestamp,
  reportLocalCommunityMessage,
  sendLocalCommunityMessage,
  subscribeLocalCommunityRoomMessages,
} from '@/services/localCommunityChatService';
import {
  LOCAL_COMMUNITY_CATEGORY_LABELS,
  type LocalCommunityMessage,
  type LocalCommunityRoom,
} from '@/types/localCommunity';
import type { ChatContextMenuMessage } from '@/types/chatReactions';
import { buildChatReplyDraft, resolveChatMessageAuthorId, showChatAlert, stripChatContentForCopy } from '@/utils/chatMessageActions';
import { isPostAuthor } from '@/utils/communityPostAccess';
import { REPORT_BLIND_THRESHOLD } from '@/utils/localCommunityModeration';

type LocalCommunityChatRoomViewProps = {
  room: LocalCommunityRoom;
  onBack: () => void;
  embedded?: boolean;
};

export function LocalCommunityChatRoomView({
  room,
  onBack,
  embedded = false,
}: LocalCommunityChatRoomViewProps) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const fabBottomInset = useGlobalFabBottomInset();
  const { isDbAdmin } = useLiveDbAdmin();
  const { filterBlocked, reload: reloadBlockedUsers } = useBlockedUsers();
  const listRef = useRef<FlatList<LocalCommunityMessage>>(null);

  const [messages, setMessages] = useState<LocalCommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [contextMenuMessage, setContextMenuMessage] = useState<ChatContextMenuMessage | null>(null);
  const [replyTarget, setReplyTarget] = useState<ChatContextMenuMessage | null>(null);
  const { reactionsByMessageId, toggleReaction } = useChatRoomReactions('local_community', room.id);

  const visibleMessages = useMemo(() => filterBlocked(messages), [filterBlocked, messages]);

  const canDeleteMessage = useCallback(
    (authorId?: string | null) => isDbAdmin || isPostAuthor(authorId, user?.id),
    [isDbAdmin, user?.id],
  );

  const loadMessages = useCallback(async () => {
    try {
      const rows = await fetchLocalCommunityMessages(room.id);
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
    void bootstrapLocalChatRoomParticipation(room.id);
    setActiveLocalChatRoomForNotifications(room.id);

    const unsubscribe = subscribeLocalCommunityRoomMessages(room.id, () => {
      void loadMessages();
    });

    return () => {
      setActiveLocalChatRoomForNotifications(null);
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

  const handleReport = (messageId: string) => {
    Alert.alert(
      '신고하기',
      `신고가 ${REPORT_BLIND_THRESHOLD}회 이상 누적되면 자동으로 숨김 처리됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: () => {
            void reportLocalCommunityMessage(messageId)
              .then((result) => {
                if (result.alreadyReported) {
                  Alert.alert('이미 신고함', '이 메시지는 이미 신고하셨습니다.');
                  return;
                }
                if (result.blinded) {
                  Alert.alert('자동 숨김', '신고가 누적되어 메시지가 숨김 처리되었습니다.');
                  void loadMessages();
                  return;
                }
                Alert.alert('신고 완료', '신고가 접수되었습니다.');
              })
              .catch((err) => {
                Alert.alert(
                  '신고 실패',
                  err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
                );
              });
          },
        },
      ],
    );
  };

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
      await deleteLocalCommunityMessage(message.id);
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
      const message = await sendLocalCommunityMessage({
        roomId: room.id,
        content: contentToSend,
        authorId: user?.id ?? null,
      });
      setDraft('');
      setReplyTarget(null);
      setMessages((prev) => [...prev.filter((item) => item.id !== message.id), message]);
    } catch (err) {
      Alert.alert(
        '전송 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSending(false);
    }
  };

  const categoryLabel = room.category ? LOCAL_COMMUNITY_CATEGORY_LABELS[room.category] : room.topic;
  const composerBottomPadding = embedded ? 12 : Math.max(12, fabBottomInset - 48);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={embedded ? 88 : 0}
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
              {room.title}
            </Text>
            <Text className="mt-0.5 text-[11px]" style={{ color: colors.metaText }}>
              {[categoryLabel, `${room.participantCount}명 참여`, `개설 ${room.creatorLabel}`]
                .filter(Boolean)
                .join(' · ')}
            </Text>
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
            timestampLabel={formatChatTimestamp(item.createdAt)}
            headerRight={
              <Pressable hitSlop={8} onPress={() => handleReport(item.id)}>
                <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
              </Pressable>
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
