import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Text, View } from 'react-native';
import { ShortcodeTextInput } from '@/components/content/ShortcodeTextInput';
import { GuestLoginPromptModal } from '@/components/auth/GuestLoginPromptModal';
import { RichContentRenderer } from '@/components/content/RichContentRenderer';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatGuideCommentTime,
  parseKemiGuideSocialError,
} from '@/services/kemiGuideSocialService';
import type { KemiGuideComment } from '@/types/kemiGuideSocial';

type GuideCommentsSectionProps = {
  comments: KemiGuideComment[];
  commentCount?: number;
  loading?: boolean;
  submitting?: boolean;
  onSubmit: (content: string, authorLabel?: string) => Promise<void>;
};

function CommentRow({ comment }: { comment: KemiGuideComment }) {
  return (
    <View className="border-b border-kemix-border-light py-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-bold text-kemix-text">{comment.author_label}</Text>
        <Text className="text-xs text-kemix-text-secondary">
          {formatGuideCommentTime(comment.created_at)}
        </Text>
      </View>
      <View className="mt-1.5">
        <RichContentRenderer content={comment.content} />
      </View>
    </View>
  );
}

export function GuideCommentsSection({
  comments,
  commentCount,
  loading,
  submitting,
  onSubmit,
}: GuideCommentsSectionProps) {
  const { user } = useAuth();
  const [draft, setDraft] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);

  const authorLabel =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    '회원';

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!user) {
      setLoginOpen(true);
      return;
    }
    if (trimmed.length < 1) {
      Alert.alert('입력 확인', '댓글을 입력해 주세요.');
      return;
    }

    try {
      await onSubmit(trimmed, authorLabel);
      setDraft('');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        parseKemiGuideSocialError(err instanceof Error ? err.message : '다시 시도해 주세요.'),
      );
    }
  };

  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-kemix-text">댓글</Text>
        <Text className="text-sm text-kemix-text-secondary">
          {commentCount ?? comments.length}개
        </Text>
      </View>

      <View className="rounded-2xl border border-kemix-border-light bg-kemix-bg p-3">
        <ShortcodeTextInput
          className="min-h-[72px] text-sm text-kemix-text"
          placeholder={user ? '응급처치 경험이나 궁금한 점을 남겨 주세요.' : '댓글 작성은 로그인 후 가능합니다.'}
          placeholderTextColor="#94a3b8"
          value={draft}
          onChangeText={setDraft}
          multiline
          editable={!submitting}
          textAlignVertical="top"
        />
        <View className="mt-2 flex-row items-center justify-end">
          <Pressable
            className="flex-row items-center rounded-xl bg-emerald-700 px-4 py-2.5 active:opacity-90"
            onPress={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#ffffff" />
                <Text className="ml-1.5 text-sm font-bold text-white">등록</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <View className="mt-4">
        {loading ? (
          <ActivityIndicator color="#047857" className="py-6" />
        ) : comments.length === 0 ? (
          <Text className="py-6 text-center text-sm text-kemix-text-secondary">
            아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.
          </Text>
        ) : (
          comments.map((comment) => <CommentRow key={comment.id} comment={comment} />)
        )}
      </View>

      <GuestLoginPromptModal
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="댓글 작성"
        description="로그인 후 댓글을 남길 수 있습니다."
        intent={{ type: 'guide-comment' }}
      />
    </View>
  );
}
