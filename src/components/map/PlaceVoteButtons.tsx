import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';
import { usePlaceVoteContext } from '@/components/map/PlaceVoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlaceVoteSummaries } from '@/hooks/usePlaceVoteSummaries';
import type { PlaceVoteKind, PlaceVoteType } from '@/types/placeVote';

type PlaceVoteButtonsProps = {
  placeKind: PlaceVoteKind;
  placeId: string;
  className?: string;
  compact?: boolean;
};

function VoteButton({
  label,
  count,
  active,
  disabled,
  onPress,
  compact,
}: {
  label: string;
  count: number;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`flex-row items-center rounded-full border px-2.5 py-1.5 ${
        active
          ? 'border-kemix-primary bg-kemix-primary/10'
          : 'border-kemix-border bg-kemix-surface'
      } ${compact ? 'min-w-[72px]' : 'min-w-[84px]'} ${disabled ? 'opacity-60' : ''}`}
    >
      <Text className={`text-sm ${active ? 'text-kemix-primary' : 'text-kemix-text'}`}>
        {label}
      </Text>
      <Text
        className={`ml-1.5 text-sm font-semibold ${
          active ? 'text-kemix-primary' : 'text-kemix-text-secondary'
        }`}
      >
        {count}
      </Text>
    </Pressable>
  );
}

export function PlaceVoteButtons({
  placeKind,
  placeId,
  className = '',
  compact = false,
}: PlaceVoteButtonsProps) {
  const { user } = useAuth();
  const batchContext = usePlaceVoteContext();
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState<PlaceVoteType | null>(null);

  const trimmedId = placeId.trim();
  const enabled = trimmedId.length > 0;

  const standalone = usePlaceVoteSummaries(
    enabled && !batchContext
      ? [{ place_kind: placeKind, place_id: trimmedId }]
      : [],
  );

  const summary = batchContext
    ? batchContext.getSummary(placeKind, trimmedId)
    : standalone.getSummary(placeKind, trimmedId);

  const isLoading = batchContext ? batchContext.isLoading : standalone.isLoading;
  const isToggling = batchContext ? batchContext.isToggling : standalone.isToggling;

  const handleVote = async (voteType: PlaceVoteType) => {
    if (!enabled) return;

    if (!user) {
      setLoginOpen(true);
      return;
    }

    setPendingVote(voteType);
    try {
      if (batchContext) {
        await batchContext.toggle(placeKind, trimmedId, voteType);
      } else {
        await standalone.toggle(placeKind, trimmedId, voteType);
      }
    } finally {
      setPendingVote(null);
    }
  };

  if (!enabled) return null;

  return (
    <>
      <View className={`flex-row items-center gap-2 ${className}`}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#64748b" />
        ) : (
          <>
            <VoteButton
              label="👍"
              count={summary.like_count}
              active={summary.my_vote === 'like'}
              disabled={isToggling}
              onPress={() => void handleVote('like')}
              compact={compact}
            />
            <VoteButton
              label="👎"
              count={summary.dislike_count}
              active={summary.my_vote === 'dislike'}
              disabled={isToggling}
              onPress={() => void handleVote('dislike')}
              compact={compact}
            />
          </>
        )}
        {isToggling && pendingVote ? (
          <ActivityIndicator size="small" color="#64748b" />
        ) : null}
      </View>

      <GuestLoginPromptModal
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="로그인 후 이용 가능합니다"
        description="장소 평가는 로그인 후 이용할 수 있습니다."
        intent={{ type: 'map-place-vote' }}
      />
    </>
  );
}
