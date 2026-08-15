import { CommunityHtmlContent } from '@/components/community/CommunityHtmlContent';
import {
  LoungeAnonymousBadge,
  LoungeCard,
  LoungeMetaText,
} from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { formatRelativeTime } from '@/services/communityService';
import type { CommunityComment } from '@/types/community';
import { Text, View } from 'react-native';

type CommunityCommentRowProps = {
  comment: CommunityComment;
  variant?: 'lounge' | 'default';
};

export function CommunityCommentRow({ comment, variant = 'lounge' }: CommunityCommentRowProps) {
  if (variant === 'lounge') {
    return (
      <LoungeCard style={{ marginBottom: 10 }}>
        <View className="flex-row items-center justify-between">
          <LoungeAnonymousBadge label={comment.anonymous_label} />
          <LoungeMetaText>{formatRelativeTime(comment.created_at)}</LoungeMetaText>
        </View>
        <View className="mt-3">
          <CommunityHtmlContent content={comment.content} />
        </View>
      </LoungeCard>
    );
  }

  return (
    <View className="mb-3 rounded-xl border border-kemix-border-light bg-kemix-bg p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-kemix-text">{comment.anonymous_label}</Text>
        <Text className="text-[10px] text-kemix-muted">{formatRelativeTime(comment.created_at)}</Text>
      </View>
      <View className="mt-2">
        <CommunityHtmlContent content={comment.content} />
      </View>
    </View>
  );
}

type CommunityCommentEmptyProps = {
  message?: string;
  variant?: 'lounge' | 'default';
};

export function CommunityCommentEmpty({
  message = '아직 댓글이 없습니다.',
  variant = 'lounge',
}: CommunityCommentEmptyProps) {
  const { lounge } = useEmsLoungeTheme();

  if (variant === 'lounge') {
    return (
      <Text
        style={{
          fontFamily: 'Pretendard',
          fontSize: 14,
          color: lounge.textSecondary,
        }}
      >
        {message}
      </Text>
    );
  }

  return <Text className="text-sm text-kemix-text-secondary">{message}</Text>;
}
