import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import { useAppTheme } from '@/contexts/AppThemeContext';
import {
  LOCAL_COMMUNITY_CATEGORY_LABELS,
  type LocalCommunityPost,
} from '@/types/localCommunity';
import { formatRemainingTtl, REPORT_BLIND_THRESHOLD } from '@/utils/localCommunityModeration';

type LocalCommunityPostCardProps = {
  post: LocalCommunityPost;
  onReport: (postId: string) => Promise<{ alreadyReported: boolean; blinded: boolean }>;
};

export function LocalCommunityPostCard({ post, onReport }: LocalCommunityPostCardProps) {
  const { colors } = useAppTheme();

  const handleReport = () => {
    Alert.alert(
      '신고하기',
      `신고가 ${REPORT_BLIND_THRESHOLD}회 이상 누적되면 자동으로 숨김 처리됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: () => {
            void onReport(post.id).then((result) => {
              if (result.alreadyReported) {
                Alert.alert('이미 신고함', '이 글은 이미 신고하셨습니다.');
                return;
              }
              if (result.blinded) {
                Alert.alert('자동 숨김', '신고가 누적되어 글이 숨김 처리되었습니다.');
                return;
              }
              Alert.alert('신고 완료', '신고가 접수되었습니다.');
            });
          },
        },
      ],
    );
  };

  const createdLabel = new Date(post.createdAt).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View
      className="rounded-xl border p-3"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.borderLight,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row flex-1 items-center">
          <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
            {post.anonymousLabel}
          </Text>
          <View
            className="mx-2 h-3 w-px"
            style={{ backgroundColor: colors.border }}
          />
          <Text className="text-[10px] font-semibold" style={{ color: colors.categoryAccent }}>
            {LOCAL_COMMUNITY_CATEGORY_LABELS[post.category]}
          </Text>
        </View>
        <Pressable className="flex-row items-center px-1 py-0.5" onPress={handleReport} hitSlop={8}>
          <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
          <Text className="ml-1 text-[10px]" style={{ color: colors.metaText }}>
            신고
          </Text>
        </Pressable>
      </View>
      <View className="mt-2">
        <RichContentRenderer content={post.content} tone="community" />
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-[10px]" style={{ color: colors.metaText }}>
          {createdLabel}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text className="ml-1 text-[10px]" style={{ color: colors.metaText }}>
            {formatRemainingTtl(post.expiresAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}
