import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { subscribeEmsCommunityPostsTable } from '@/lib/realtimeSubscription';
import {
  adminDeleteCommunityPost,
  adminHideCommunityPost,
  adminListCommunityPostsForModeration,
  adminUnhideCommunityPost,
  formatAdminPostDate,
  moderationBoardLabel,
  moderationPostTypeLabel,
  summarizeAdminPost,
  type AdminCommunityPost,
  type ModerationBoard,
} from '@/services/emsCommunityService';

type ConfirmAction = 'hide' | 'delete';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function PostModerationCard({
  post,
  onHide,
  onUnhide,
  onDelete,
}: {
  post: AdminCommunityPost;
  onHide: (post: AdminCommunityPost) => void;
  onUnhide: (post: AdminCommunityPost) => void;
  onDelete: (post: AdminCommunityPost) => void;
}) {
  const title = post.title?.trim() || '제목 없음';

  return (
    <View
      className={`mb-2 rounded-xl border p-3 ${
        post.is_hidden ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
          {moderationPostTypeLabel(post.post_type)}
        </Text>
        {post.is_hidden ? (
          <Text className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            블라인드
          </Text>
        ) : null}
      </View>

      <Text className="mt-2 font-semibold text-slate-900">{title}</Text>
      <Text className="mt-0.5 text-xs text-slate-500">
        {post.anonymous_label} · {formatAdminPostDate(post.created_at)}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-slate-600" numberOfLines={3}>
        {summarizeAdminPost(post)}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {post.is_hidden ? (
          <Pressable
            className="rounded-lg bg-green-100 px-2.5 py-1"
            onPress={() => onUnhide(post)}
          >
            <Text className="text-[11px] font-bold text-green-700">숨김 해제</Text>
          </Pressable>
        ) : (
          <Pressable className="rounded-lg bg-amber-100 px-2.5 py-1" onPress={() => onHide(post)}>
            <Text className="text-[11px] font-bold text-amber-800">블라인드</Text>
          </Pressable>
        )}
        <Pressable className="rounded-lg bg-red-100 px-2.5 py-1" onPress={() => onDelete(post)}>
          <Text className="text-[11px] font-bold text-red-700">삭제</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AdminCommunityModerationPanel() {
  const [board, setBoard] = useState<ModerationBoard>('case_study');
  const [includeHidden, setIncludeHidden] = useState(true);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionTarget, setActionTarget] = useState<AdminCommunityPost | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await adminListCommunityPostsForModeration(board, { includeHidden });
      setPosts(rows);
    } catch (error) {
      console.error('[AdminCommunityModeration] reload failed', { board, error });
      showAlert('조회 실패', error instanceof Error ? error.message : '게시글을 불러올 수 없습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [board, includeHidden]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  useEffect(() => {
    const unsubscribe = subscribeEmsCommunityPostsTable(() => {
      void reload();
    });
    return unsubscribe;
  }, [reload]);

  const openConfirm = (action: ConfirmAction, post: AdminCommunityPost) => {
    setConfirmAction(action);
    setActionTarget(post);
  };

  const handleConfirm = async () => {
    if (!actionTarget || !confirmAction) return;

    const postId = actionTarget.id;
    const postTitle = actionTarget.title?.trim() || '제목 없음';

    setSubmitting(true);
    setConfirmAction(null);
    setActionTarget(null);

    setPosts((prev) => {
      if (confirmAction === 'delete') {
        return prev.filter((item) => item.id !== postId);
      }
      if (confirmAction === 'hide' && !includeHidden) {
        return prev.filter((item) => item.id !== postId);
      }
      return prev.map((item) =>
        item.id === postId ? { ...item, is_hidden: confirmAction === 'hide' } : item,
      );
    });

    try {
      if (confirmAction === 'hide') {
        await adminHideCommunityPost(postId);
        showAlert('완료', `"${postTitle}" 게시글이 블라인드 처리되었습니다.`);
      } else {
        await adminDeleteCommunityPost(postId);
        showAlert('완료', `"${postTitle}" 게시글이 삭제되었습니다.`);
      }
      await reload();
    } catch (error) {
      console.error('[AdminCommunityModeration] action failed', {
        action: confirmAction,
        postId,
        error,
      });
      await reload();
      showAlert('실패', error instanceof Error ? error.message : '처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnhide = async (post: AdminCommunityPost) => {
    const postId = post.id;
    const postTitle = post.title?.trim() || '제목 없음';

    setSubmitting(true);
    setPosts((prev) =>
      prev.map((item) => (item.id === postId ? { ...item, is_hidden: false } : item)),
    );

    try {
      await adminUnhideCommunityPost(postId);
      showAlert('완료', `"${postTitle}" 게시글 블라인드가 해제되었습니다.`);
      await reload();
    } catch (error) {
      console.error('[AdminCommunityModeration] unhide failed', { postId, error });
      await reload();
      showAlert('실패', error instanceof Error ? error.message : '숨김 해제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmTitle =
    confirmAction === 'delete'
      ? '게시글 삭제'
      : confirmAction === 'hide'
        ? '게시글 블라인드'
        : '';
  const confirmMessage =
    confirmAction === 'delete'
      ? `"${actionTarget?.title ?? '제목 없음'}" 게시글을 영구 삭제하시겠습니까?`
      : confirmAction === 'hide'
        ? `"${actionTarget?.title ?? '제목 없음'}" 게시글을 블라인드(숨김) 처리하시겠습니까?`
        : '';

  return (
    <View className="flex-1">
      <SegmentControl
        options={[
          { value: 'case_study', label: '케이스' },
          { value: 'resource', label: '자료실' },
          { value: 'jobs', label: '구인구직' },
        ]}
        value={board}
        onChange={setBoard}
      />

      <View className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-semibold text-slate-800">블라인드 글 포함</Text>
          <Text className="mt-0.5 text-[11px] text-slate-500">
            {moderationBoardLabel(board)} 게시판 모니터링
          </Text>
        </View>
        <Switch value={includeHidden} onValueChange={setIncludeHidden} />
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          className="mt-3"
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-slate-500">
              {includeHidden
                ? '등록된 게시글이 없습니다.'
                : '표시할 운영 중 게시글이 없습니다.'}
            </Text>
          }
          renderItem={({ item }) => (
            <PostModerationCard
              post={item}
              onHide={(post) => openConfirm('hide', post)}
              onUnhide={(post) => void handleUnhide(post)}
              onDelete={(post) => openConfirm('delete', post)}
            />
          )}
        />
      )}

      <AdminConfirmModal
        visible={!!confirmAction && !!actionTarget}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmAction === 'delete' ? '삭제' : '블라인드'}
        destructive={confirmAction === 'delete'}
        loading={submitting}
        onConfirm={() => void handleConfirm()}
        onCancel={() => {
          setConfirmAction(null);
          setActionTarget(null);
        }}
      />
    </View>
  );
}
