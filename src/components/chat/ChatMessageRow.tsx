import type { ReactNode } from 'react';
import { Platform, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { BlockableAuthorLabel } from '@/components/community/BlockableAuthorLabel';
import { ChatMessageReactions } from '@/components/chat/ChatMessageReactions';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { ChatMessageReactionSummary, ChatMessageReactionType } from '@/types/chatReactions';

type ChatMessageRowProps = {
  id: string;
  content: string;
  anonymousLabel: string;
  authorId?: string | null;
  timestampLabel: string;
  headerRight?: ReactNode;
  reactionSummary?: ChatMessageReactionSummary;
  onOpenContextMenu: () => void;
  onToggleReaction: (messageId: string, reaction: ChatMessageReactionType) => Promise<ChatMessageReactionSummary>;
  onAuthorBlocked?: () => void;
};

function isInteractiveWebTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('button, a[href], input, textarea, select, [role="button"]'));
}

function ChatMessageBubble({
  content,
  onOpenContextMenu,
}: {
  content: string;
  onOpenContextMenu: () => void;
}) {
  const { colors } = useAppTheme();

  const handleWebContextMenu = (event: GestureResponderEvent) => {
    event.preventDefault();
    onOpenContextMenu();
  };

  const handleWebClick = (event: GestureResponderEvent) => {
    if (isInteractiveWebTarget(event.target)) return;
    onOpenContextMenu();
  };

  const bubble = (
    <View
      className="self-start rounded-2xl rounded-tl-sm px-3 py-2.5"
      style={{
        maxWidth: '92%',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <RichContentRenderer content={content} tone="community" disableTextInteraction />
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View
        accessibilityRole="group"
        accessibilityLabel="채팅 메시지"
        onContextMenu={handleWebContextMenu}
        onClick={handleWebClick}
      >
        {bubble}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="메시지 옵션을 보려면 길게 누르세요"
      delayLongPress={280}
      onLongPress={onOpenContextMenu}
      android_disableSound
    >
      {bubble}
    </Pressable>
  );
}

export function ChatMessageRow({
  id,
  content,
  anonymousLabel,
  authorId,
  timestampLabel,
  headerRight,
  reactionSummary,
  onOpenContextMenu,
  onToggleReaction,
  onAuthorBlocked,
}: ChatMessageRowProps) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-3 px-1">
      <View className="mb-1 flex-row items-center justify-between">
        <BlockableAuthorLabel
          label={anonymousLabel}
          authorId={authorId}
          onBlocked={onAuthorBlocked}
        />
        <View className="flex-row items-center">
          <Text className="mr-2 text-[10px]" style={{ color: colors.metaText }}>
            {timestampLabel}
          </Text>
          {headerRight}
        </View>
      </View>
      <ChatMessageBubble content={content} onOpenContextMenu={onOpenContextMenu} />
      <ChatMessageReactions
        messageId={id}
        summary={reactionSummary}
        onToggleReaction={onToggleReaction}
      />
    </View>
  );
}
