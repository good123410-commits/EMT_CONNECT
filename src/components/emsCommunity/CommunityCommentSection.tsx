import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { CommunityCommentEmpty, CommunityCommentRow } from '@/components/emsCommunity/CommunityCommentRow';
import {
  LoungeInput,
  LoungePrimaryButton,
} from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { usePostComments } from '@/hooks/usePostComments';
import { parseCommunityError } from '@/services/communityService';
import type { CommunityComment } from '@/types/community';

export type CommunityCommentSectionProps = {
  postId: string | null;
  enabled?: boolean;
  disabledMessage?: string;
  canWrite?: boolean;
  writeDeniedMessage?: string;
  authorLabel?: string;
  sectionLabel?: string;
  emptyMessage?: string;
  placeholder?: string;
  submitLabel?: string;
  variant?: 'lounge' | 'default';
  /** 외부에서 댓글 목록을 제어할 때 */
  comments?: CommunityComment[];
  loading?: boolean;
  onSubmitComment?: (content: string) => Promise<void>;
  submitting?: boolean;
};

/**
 * 질문함·케이스·구인구직 등 EMS 커뮤니티 게시글 하단 댓글/답변 영역.
 * `postId`가 `ems_community_posts.id`와 일치할 때 Supabase `ems_community_comments`와 연동된다.
 */
export function CommunityCommentSection({
  postId,
  enabled = true,
  disabledMessage = '이 콘텐츠에는 댓글을 달 수 없습니다.',
  canWrite = true,
  writeDeniedMessage = '댓글을 작성하려면 로그인이 필요합니다.',
  authorLabel = '회원',
  sectionLabel = '댓글',
  emptyMessage,
  placeholder = '댓글을 입력해 주세요',
  submitLabel = '댓글 등록',
  variant = 'lounge',
  comments: externalComments,
  loading: externalLoading,
  onSubmitComment,
  submitting: externalSubmitting,
}: CommunityCommentSectionProps) {
  const { lounge } = useEmsLoungeTheme();
  const [draft, setDraft] = useState('');
  const internal = usePostComments(enabled ? postId : null);

  const comments = externalComments ?? internal.comments;
  const loading = externalLoading ?? internal.loading;
  const submitting = externalSubmitting ?? internal.submitting;

  const handleSubmit = async () => {
    if (!canWrite) {
      Alert.alert('안내', writeDeniedMessage);
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('입력 확인', '댓글 내용을 입력해 주세요.');
      return;
    }

    try {
      if (onSubmitComment) {
        await onSubmitComment(trimmed);
      } else {
        await internal.submitComment(trimmed, authorLabel);
      }
      setDraft('');
      Alert.alert('등록 완료', `${sectionLabel}이 등록되었습니다.`);
    } catch (err) {
      Alert.alert(
        '등록 실패',
        parseCommunityError(err instanceof Error ? err.message : '다시 시도해 주세요.'),
      );
    }
  };

  if (!enabled) {
    return (
      <View
        style={{
          marginTop: 20,
          borderRadius: 16,
          backgroundColor: lounge.amberBg,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontFamily: 'Pretendard',
            fontSize: 13,
            color: lounge.amberText,
          }}
        >
          {disabledMessage}
        </Text>
      </View>
    );
  }

  const sectionTitleStyle =
    variant === 'lounge'
      ? {
          marginTop: 20,
          marginBottom: 10,
          fontFamily: 'Pretendard-Bold' as const,
          fontSize: 14,
          color: lounge.text,
        }
      : undefined;

  return (
    <View style={{ marginTop: variant === 'lounge' ? 0 : 16 }}>
      {variant === 'lounge' ? (
        <Text style={sectionTitleStyle}>
          {sectionLabel} {comments.length}
        </Text>
      ) : (
        <Text className="mb-2 text-sm font-bold text-kemix-text">
          {sectionLabel} {comments.length}
        </Text>
      )}

      {loading ? <ActivityIndicator color={variant === 'lounge' ? lounge.accent : '#15803d'} /> : null}

      {comments.map((comment) => (
        <CommunityCommentRow key={comment.id} comment={comment} variant={variant} />
      ))}

      {!loading && comments.length === 0 ? (
        <CommunityCommentEmpty
          message={emptyMessage ?? `아직 ${sectionLabel}이 없습니다.`}
          variant={variant}
        />
      ) : null}

      {canWrite ? (
        variant === 'lounge' ? (
          <View
            style={{
              marginTop: 16,
              borderRadius: 16,
              backgroundColor: lounge.surface,
              borderWidth: 1,
              borderColor: lounge.border,
              padding: 16,
            }}
          >
            <Text
              style={{
                marginBottom: 10,
                fontFamily: 'Pretendard-Bold',
                fontSize: 14,
                color: lounge.text,
              }}
            >
              {sectionLabel} 작성
            </Text>
            <LoungeInput
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              multiline
              minHeight={100}
            />
            <View style={{ marginTop: 12 }}>
              <LoungePrimaryButton
                label={submitting ? '등록 중…' : submitLabel}
                disabled={submitting}
                onPress={() => void handleSubmit()}
              />
            </View>
          </View>
        ) : (
          <View className="mt-4 rounded-2xl border border-green-200 bg-kemix-surface p-4">
            <Text className="mb-2 text-sm font-bold text-green-800">{sectionLabel} 작성</Text>
            <TextInput
              className="min-h-[100px] rounded-xl border border-kemix-border bg-kemix-bg px-3 py-3 text-sm"
              placeholder={placeholder}
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              className={`mt-3 items-center rounded-xl py-3 ${submitting ? 'bg-slate-300' : 'bg-green-700'}`}
              disabled={submitting}
              onPress={() => void handleSubmit()}
            >
              <Text className="font-bold text-white">{submitting ? '등록 중…' : submitLabel}</Text>
            </Pressable>
          </View>
        )
      ) : (
        <View
          style={{
            marginTop: 16,
            borderRadius: 16,
            backgroundColor: variant === 'lounge' ? lounge.amberBg : undefined,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
          className={variant === 'default' ? 'rounded-2xl border border-amber-200 bg-amber-50' : undefined}
        >
          <Text
            style={
              variant === 'lounge'
                ? {
                    textAlign: 'center',
                    fontFamily: 'Pretendard',
                    fontSize: 13,
                    color: lounge.amberText,
                  }
                : undefined
            }
            className={variant === 'default' ? 'text-center text-sm text-amber-800' : undefined}
          >
            {writeDeniedMessage}
          </Text>
        </View>
      )}
    </View>
  );
}
