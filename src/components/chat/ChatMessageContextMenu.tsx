import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  CHAT_REACTION_QUICK_OPTIONS,
  type ChatContextMenuMessage,
  type ChatMessageReactionSummary,
  type ChatMessageReactionType,
} from '@/types/chatReactions';
import { copyChatMessageContent, stripChatContentForCopy } from '@/utils/chatMessageActions';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';

type ChatMessageContextMenuProps = {
  visible: boolean;
  message: ChatContextMenuMessage | null;
  summary?: ChatMessageReactionSummary;
  canDelete?: boolean;
  onClose: () => void;
  onToggleReaction: (messageId: string, reaction: ChatMessageReactionType) => Promise<void>;
  onReply: (message: ChatContextMenuMessage) => void;
  onDelete?: (message: ChatContextMenuMessage) => void;
};

type MenuAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

function ReactionButton({
  emoji,
  active,
  disabled,
  onPress,
}: {
  emoji: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className="mx-1 items-center justify-center rounded-full active:opacity-80"
      style={{
        width: 44,
        height: 44,
        backgroundColor: active ? colors.blueMuted : colors.surfaceElevated,
        borderWidth: 1,
        borderColor: active ? colors.blue : colors.borderLight,
        opacity: disabled ? 0.5 : 1,
      }}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </Pressable>
  );
}

function SelectCopyModal({
  visible,
  content,
  onClose,
}: {
  visible: boolean;
  content: string;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const plain = stripChatContentForCopy(content);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/40 px-6" onPress={onClose}>
        <Pressable
          className="w-full max-w-md rounded-2xl p-4"
          style={{ backgroundColor: colors.surface }}
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="mb-3 text-sm font-bold" style={{ color: colors.textPrimary }}>
            선택 복사
          </Text>
          <Text
            selectable
            className="rounded-xl border px-3 py-3 text-sm leading-5"
            style={{
              borderColor: colors.borderLight,
              backgroundColor: colors.background,
              color: colors.textPrimary,
            }}
          >
            {plain || '(복사할 텍스트 없음)'}
          </Text>
          <Pressable
            className="mt-4 items-center rounded-xl py-3 active:opacity-90"
            style={{ backgroundColor: colors.blue }}
            onPress={onClose}
          >
            <Text className="text-sm font-semibold text-white">닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ChatMessageContextMenu({
  visible,
  message,
  summary,
  canDelete = false,
  onClose,
  onToggleReaction,
  onReply,
  onDelete,
}: ChatMessageContextMenuProps) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectCopyVisible, setSelectCopyVisible] = useState(false);
  const lastMessageRef = useRef<ChatContextMenuMessage | null>(null);

  if (message) {
    lastMessageRef.current = message;
  }

  const activeMessage = message ?? lastMessageRef.current;
  const myReaction = summary?.myReaction ?? null;

  const handleClose = () => {
    onClose();
  };

  const handleToggleReaction = async (reaction: ChatMessageReactionType) => {
    if (!activeMessage) return;
    if (!user) {
      Alert.alert('로그인 필요', '반응을 남기려면 로그인해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await onToggleReaction(activeMessage.id, reaction);
      handleClose();
    } catch (error) {
      Alert.alert(
        '반응 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || !activeMessage) {
    return null;
  }

  const menuActions: MenuAction[] = [
    {
      key: 'copy',
      label: '복사',
      icon: 'copy-outline',
      onPress: () => {
        void copyChatMessageContent(activeMessage.content).finally(handleClose);
      },
    },
    {
      key: 'select-copy',
      label: '선택 복사',
      icon: 'text-outline',
      onPress: () => {
        setSelectCopyVisible(true);
      },
    },
    {
      key: 'reply',
      label: '답장',
      icon: 'arrow-undo-outline',
      onPress: () => {
        onReply(activeMessage);
        handleClose();
      },
    },
  ];

  if (canDelete && onDelete) {
    menuActions.push({
      key: 'delete',
      label: '삭제',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => {
        confirmDestructiveAction('메시지 삭제', '이 메시지를 삭제할까요?', () => {
          onDelete(activeMessage);
          handleClose();
        });
      },
    });
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <Pressable
          className="flex-1 items-center justify-center bg-black/35 px-5"
          style={
            Platform.OS === 'web'
              ? { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999 }
              : undefined
          }
          onPress={handleClose}
        >
          <Pressable
            className="w-full max-w-sm overflow-hidden rounded-2xl"
            style={{
              backgroundColor: colors.surface,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              {CHAT_REACTION_QUICK_OPTIONS.map((option) => (
                <ReactionButton
                  key={option.key}
                  emoji={option.emoji}
                  active={myReaction === option.key}
                  disabled={submitting}
                  onPress={() => void handleToggleReaction(option.key)}
                />
              ))}
            </ScrollView>

            <View style={{ height: 1, backgroundColor: colors.borderLight }} />

            {menuActions.map((action, index) => (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                className="flex-row items-center px-4 py-3.5 active:opacity-80"
                style={{
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.borderLight,
                }}
                onPress={action.onPress}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.destructive ? '#ef4444' : colors.textSecondary}
                />
                <Text
                  className="ml-3 text-[15px]"
                  style={{ color: action.destructive ? '#ef4444' : colors.textPrimary }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <SelectCopyModal
        visible={selectCopyVisible}
        content={activeMessage.content}
        onClose={() => {
          setSelectCopyVisible(false);
          handleClose();
        }}
      />
    </>
  );
}
