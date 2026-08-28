import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Alert, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { ShortcodeComposerField } from '@/components/content/ShortcodeComposerField';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { APP_SPACING } from '@/constants/appTheme';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import {
  bootstrapLocalChatRoomParticipation,
  setActiveLocalChatRoomForNotifications,
} from '@/contexts/PushNotificationContext';
import {
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
import { REPORT_BLIND_THRESHOLD } from '@/utils/localCommunityModeration';

type LocalCommunityChatRoomViewProps = {
  room: LocalCommunityRoom;
  onBack: () => void;
  embedded?: boolean;
};

function ChatMessageBubble({
  message,
  onReport,
}: {
  message: LocalCommunityMessage;
  onReport: (messageId: string) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-3 px-1">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
          {message.anonymousLabel}
        </Text>
        <View className="flex-row items-center">
          <Text className="mr-2 text-[10px]" style={{ color: colors.metaText }}>
            {formatChatTimestamp(message.createdAt)}
          </Text>
          <Pressable hitSlop={8} onPress={() => onReport(message.id)}>
            <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
          </Pressable>
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

export function LocalCommunityChatRoomView({
  room,
  onBack,
  embedded = false,
}: LocalCommunityChatRoomViewProps) {
  const { colors } = useAppTheme();
  const fabBottomInset = useGlobalFabBottomInset();
  const listRef = useRef<FlatList<LocalCommunityMessage>>(null);

  const [messages, setMessages] = useState<LocalCommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

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

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < 1) {
      Alert.alert('입력 부족', '메시지를 입력해 주세요.');
      return;
    }

    setSending(true);
    try {
      const message = await sendLocalCommunityMessage({ roomId: room.id, content: trimmed });
      setDraft('');
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
        renderItem={({ item }) => (
          <ChatMessageBubble message={item} onReport={handleReport} />
        )}
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
