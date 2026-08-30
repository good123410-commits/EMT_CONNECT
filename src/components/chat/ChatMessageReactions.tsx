import { Alert, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  CHAT_REACTION_OPTIONS,
  type ChatMessageReactionSummary,
  type ChatMessageReactionType,
} from '@/types/chatReactions';

type ChatMessageReactionsProps = {
  messageId: string;
  summary?: ChatMessageReactionSummary;
  onToggleReaction: (messageId: string, reaction: ChatMessageReactionType) => Promise<void>;
};

function ReactionChip({
  emoji,
  count,
  active,
  onPress,
}: {
  emoji: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className="mr-1.5 flex-row items-center rounded-full px-2 py-1 active:opacity-80"
      style={{
        backgroundColor: active ? colors.blueMuted : colors.surfaceElevated,
        borderWidth: 1,
        borderColor: active ? colors.blue : colors.borderLight,
      }}
      onPress={onPress}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text
        className="ml-1 text-[11px] font-semibold"
        style={{ color: active ? colors.blue : colors.textSecondary }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

export function ChatMessageReactions({
  messageId,
  summary,
  onToggleReaction,
}: ChatMessageReactionsProps) {
  const { user } = useAuth();
  const counts = summary?.counts ?? {};
  const myReaction = summary?.myReaction ?? null;
  const visibleReactions = CHAT_REACTION_OPTIONS.filter((option) => (counts[option.key] ?? 0) > 0);

  if (visibleReactions.length === 0) {
    return null;
  }

  const handleToggle = async (reaction: ChatMessageReactionType) => {
    if (!user) {
      Alert.alert('로그인 필요', '반응을 남기려면 로그인해 주세요.');
      return;
    }

    try {
      await onToggleReaction(messageId, reaction);
    } catch (error) {
      Alert.alert(
        '반응 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <View className="mt-1.5 flex-row flex-wrap items-center">
      {visibleReactions.map((option) => (
        <ReactionChip
          key={option.key}
          emoji={option.emoji}
          count={counts[option.key] ?? 0}
          active={myReaction === option.key}
          onPress={() => void handleToggle(option.key)}
        />
      ))}
    </View>
  );
}
