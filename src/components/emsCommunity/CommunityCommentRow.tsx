import { useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Text, View } from 'react-native';
import { CommunityHtmlContent } from '@/components/community/CommunityHtmlContent';
import { ShortcodeTextInput } from '@/components/content/ShortcodeTextInput';
import {
  LoungeAnonymousBadge,
  LoungeCard,
  LoungeInput,
  LoungeMetaText,
} from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { formatRelativeTime, parseCommunityError } from '@/services/communityService';
import type { CommunityComment } from '@/types/community';
import { isPostAuthor } from '@/utils/communityPostAccess';
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction';

type CommunityCommentRowProps = {
  comment: CommunityComment;
  variant?: 'lounge' | 'default';
  currentUserId?: string | null;
  isModerator?: boolean;
  saving?: boolean;
  onSaveEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
};

function CommentActionButton({
  label,
  onPress,
  destructive = false,
  variant,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  variant: 'lounge' | 'default';
}) {
  const { lounge } = useEmsLoungeTheme();

  if (variant === 'lounge') {
    return (
      <Pressable
        className="rounded-lg px-2.5 py-1.5 active:opacity-85"
        style={{
          backgroundColor: destructive ? lounge.errorBg : lounge.surface,
          borderWidth: 1,
          borderColor: destructive ? '#fecaca' : lounge.border,
        }}
        onPress={onPress}
      >
        <Text
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: 11,
            color: destructive ? lounge.error : lounge.textSecondary,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      className={`rounded-lg px-2.5 py-1.5 active:opacity-85 ${
        destructive ? 'border border-red-200 bg-red-50' : 'border border-kemix-border bg-kemix-surface'
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-[11px] font-semibold ${destructive ? 'text-red-600' : 'text-kemix-text-secondary'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CommunityCommentRow({
  comment,
  variant = 'lounge',
  currentUserId,
  isModerator = false,
  saving = false,
  onSaveEdit,
  onDelete,
}: CommunityCommentRowProps) {
  const { lounge } = useEmsLoungeTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [localSaving, setLocalSaving] = useState(false);

  const isAuthor = isPostAuthor(comment.author_id, currentUserId);
  const canEdit = isAuthor && Boolean(onSaveEdit);
  const canDeleteOwn = isAuthor && Boolean(onDelete);
  const canAdminDelete = isModerator && !isAuthor && Boolean(onDelete);
  const isBusy = saving || localSaving;

  const handleStartEdit = () => {
    setDraft(comment.content);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setDraft(comment.content);
    setEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!onSaveEdit) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('입력 확인', '댓글 내용을 입력해 주세요.');
      return;
    }

    setLocalSaving(true);
    try {
      await onSaveEdit(comment.id, trimmed);
      setEditing(false);
    } catch (err) {
      Alert.alert(
        '수정 실패',
        parseCommunityError(err instanceof Error ? err.message : '다시 시도해 주세요.'),
      );
    } finally {
      setLocalSaving(false);
    }
  };

  const handleDelete = (adminMode: boolean) => {
    if (!onDelete) return;

    confirmDestructiveAction(
      adminMode ? '관리자 댓글 삭제' : '댓글 삭제',
      adminMode
        ? '관리자 권한으로 이 댓글을 삭제하시겠습니까?'
        : '댓글을 삭제하시겠습니까?',
      async () => {
        setLocalSaving(true);
        try {
          await onDelete(comment.id);
        } catch (err) {
          Alert.alert(
            '삭제 실패',
            parseCommunityError(err instanceof Error ? err.message : '다시 시도해 주세요.'),
          );
        } finally {
          setLocalSaving(false);
        }
      },
    );
  };

  const actionRow =
    !editing && (canEdit || canDeleteOwn || canAdminDelete) ? (
      <View className="mt-3 flex-row flex-wrap gap-2">
        {canEdit ? (
          <CommentActionButton label="수정" onPress={handleStartEdit} variant={variant} />
        ) : null}
        {canDeleteOwn ? (
          <CommentActionButton
            label="삭제"
            onPress={() => handleDelete(false)}
            destructive
            variant={variant}
          />
        ) : null}
        {canAdminDelete ? (
          <CommentActionButton
            label="관리자 삭제"
            onPress={() => handleDelete(true)}
            destructive
            variant={variant}
          />
        ) : null}
      </View>
    ) : null;

  const editForm =
    editing && canEdit ? (
      <View className="mt-3">
        {variant === 'lounge' ? (
          <LoungeInput
            value={draft}
            onChangeText={setDraft}
            multiline
            minHeight={88}
            editable={!isBusy}
          />
        ) : (
          <ShortcodeTextInput
            className="min-h-[88px] rounded-xl border border-kemix-border bg-kemix-bg px-3 py-3 text-sm"
            value={draft}
            onChangeText={setDraft}
            multiline
            editable={!isBusy}
            textAlignVertical="top"
          />
        )}
        <View className="mt-2 flex-row gap-2">
          <Pressable
            className={`flex-1 items-center rounded-xl py-2.5 active:opacity-90 ${
              variant === 'lounge' ? '' : 'bg-green-700'
            }`}
            style={
              variant === 'lounge'
                ? { backgroundColor: isBusy ? lounge.border : lounge.accent }
                : { opacity: isBusy ? 0.6 : 1 }
            }
            disabled={isBusy}
            onPress={() => void handleSaveEdit()}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                className="text-sm font-bold text-white"
                style={variant === 'lounge' ? { fontFamily: 'Pretendard-Bold' } : undefined}
              >
                등록
              </Text>
            )}
          </Pressable>
          <Pressable
            className="flex-1 items-center rounded-xl border py-2.5 active:opacity-90"
            style={
              variant === 'lounge'
                ? { borderColor: lounge.border, backgroundColor: lounge.surface }
                : undefined
            }
            disabled={isBusy}
            onPress={handleCancelEdit}
          >
            <Text
              className={`text-sm font-semibold ${variant === 'default' ? 'text-kemix-text-secondary' : ''}`}
              style={
                variant === 'lounge'
                  ? { color: lounge.textSecondary, fontFamily: 'Pretendard-SemiBold' }
                  : undefined
              }
            >
              취소
            </Text>
          </Pressable>
        </View>
      </View>
    ) : null;

  if (variant === 'lounge') {
    return (
      <LoungeCard style={{ marginBottom: 10 }}>
        <View className="flex-row items-center justify-between">
          <LoungeAnonymousBadge label={comment.anonymous_label} />
          <View className="flex-row items-center gap-2">
            {isBusy ? <ActivityIndicator size="small" color={lounge.accent} /> : null}
            <LoungeMetaText>{formatRelativeTime(comment.created_at)}</LoungeMetaText>
          </View>
        </View>
        {editing ? editForm : (
          <View className="mt-3">
            <CommunityHtmlContent content={comment.content} />
          </View>
        )}
        {actionRow}
      </LoungeCard>
    );
  }

  return (
    <View className="mb-3 rounded-xl border border-kemix-border-light bg-kemix-bg p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-bold text-kemix-text">{comment.anonymous_label}</Text>
        <View className="flex-row items-center gap-2">
          {isBusy ? <ActivityIndicator size="small" color="#15803d" /> : null}
          <Text className="text-[10px] text-kemix-muted">{formatRelativeTime(comment.created_at)}</Text>
        </View>
      </View>
      {editing ? editForm : (
        <View className="mt-2">
          <CommunityHtmlContent content={comment.content} />
        </View>
      )}
      {actionRow}
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
