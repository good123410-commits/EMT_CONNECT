import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, FlatList, Platform, Switch, Text, View } from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { getResourceCategoryLabel } from '@/constants/resourceCategories';
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
import {
  adminDeleteKemixResource,
  adminListKemixResources,
  adminSetKemixResourcePublished,
  formatResourceFileSize,
  subscribeKemixResources,
} from '@/services/kemixResourceService';
import type { KemixResource } from '@/types/kemixResource';

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
        post.is_hidden ? 'border-amber-200 bg-amber-50/60' : 'border-kemix-border bg-kemix-surface'
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

      <Text className="mt-2 font-semibold text-kemix-text">{title}</Text>
      <Text className="mt-0.5 text-xs text-kemix-text-secondary">
        {post.anonymous_label} · {formatAdminPostDate(post.created_at)}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-kemix-text-secondary" numberOfLines={3}>
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

function ResourceModerationCard({
  resource,
  onUnpublish,
  onPublish,
  onDelete,
}: {
  resource: KemixResource;
  onUnpublish: (resource: KemixResource) => void;
  onPublish: (resource: KemixResource) => void;
  onDelete: (resource: KemixResource) => void;
}) {
  return (
    <View
      className={`mb-2 rounded-xl border p-3 ${
        !resource.is_published
          ? 'border-amber-200 bg-amber-50/60'
          : 'border-kemix-border bg-kemix-surface'
      }`}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
          {getResourceCategoryLabel(resource.category)}
        </Text>
        {!resource.is_published ? (
          <Text className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            비공개
          </Text>
        ) : null}
      </View>

      <Text className="mt-2 font-semibold text-kemix-text">{resource.title}</Text>
      <Text className="mt-0.5 text-xs text-kemix-text-secondary">
        {formatAdminPostDate(resource.created_at)} · {resource.file_name} ·{' '}
        {formatResourceFileSize(resource.file_size)}
      </Text>
      {resource.description ? (
        <Text className="mt-2 text-sm leading-5 text-kemix-text-secondary" numberOfLines={3}>
          {resource.description}
        </Text>
      ) : null}

      <View className="mt-3 flex-row flex-wrap gap-2">
        {!resource.is_published ? (
          <Pressable
            className="rounded-lg bg-green-100 px-2.5 py-1"
            onPress={() => onPublish(resource)}
          >
            <Text className="text-[11px] font-bold text-green-700">공개 전환</Text>
          </Pressable>
        ) : (
          <Pressable
            className="rounded-lg bg-amber-100 px-2.5 py-1"
            onPress={() => onUnpublish(resource)}
          >
            <Text className="text-[11px] font-bold text-amber-800">비공개</Text>
          </Pressable>
        )}
        <Pressable className="rounded-lg bg-red-100 px-2.5 py-1" onPress={() => onDelete(resource)}>
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
  const [resources, setResources] = useState<KemixResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionTarget, setActionTarget] = useState<AdminCommunityPost | null>(null);
  const [resourceActionTarget, setResourceActionTarget] = useState<KemixResource | null>(null);

  const isResourceBoard = board === 'resource';

  const displayedResources = useMemo(() => {
    if (includeHidden) return resources;
    return resources.filter((resource) => resource.is_published);
  }, [includeHidden, resources]);

  const reload = useCallback(async () => {
    try {
      if (isResourceBoard) {
        const rows = await adminListKemixResources();
        setResources(rows);
        setPosts([]);
      } else {
        const rows = await adminListCommunityPostsForModeration(board, { includeHidden });
        setPosts(rows);
        setResources([]);
      }
    } catch (error) {
      console.error('[AdminCommunityModeration] reload failed', { board, error });
      showAlert('조회 실패', error instanceof Error ? error.message : '목록을 불러올 수 없습니다.');
      setPosts([]);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [board, includeHidden, isResourceBoard]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  useEffect(() => {
    if (isResourceBoard) {
      const unsubscribe = subscribeKemixResources(() => {
        void reload();
      });
      return unsubscribe;
    }

    const unsubscribe = subscribeEmsCommunityPostsTable(() => {
      void reload();
    });
    return unsubscribe;
  }, [isResourceBoard, reload]);

  const openConfirm = (action: ConfirmAction, post: AdminCommunityPost) => {
    setConfirmAction(action);
    setActionTarget(post);
    setResourceActionTarget(null);
  };

  const openResourceConfirm = (action: ConfirmAction, resource: KemixResource) => {
    setConfirmAction(action);
    setResourceActionTarget(resource);
    setActionTarget(null);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    if (resourceActionTarget) {
      const resource = resourceActionTarget;
      const resourceTitle = resource.title.trim() || '제목 없음';

      setSubmitting(true);
      setConfirmAction(null);
      setResourceActionTarget(null);

      setResources((prev) => {
        if (confirmAction === 'delete') {
          return prev.filter((item) => item.id !== resource.id);
        }
        if (confirmAction === 'hide' && !includeHidden) {
          return prev.filter((item) => item.id !== resource.id);
        }
        return prev.map((item) =>
          item.id === resource.id ? { ...item, is_published: confirmAction !== 'hide' } : item,
        );
      });

      try {
        if (confirmAction === 'hide') {
          await adminSetKemixResourcePublished(resource, false);
          showAlert('완료', `"${resourceTitle}" 자료가 비공개 처리되었습니다.`);
        } else {
          await adminDeleteKemixResource(resource.id);
          showAlert('완료', `"${resourceTitle}" 자료가 삭제되었습니다.`);
        }
        await reload();
      } catch (error) {
        console.error('[AdminCommunityModeration] resource action failed', {
          action: confirmAction,
          resourceId: resource.id,
          error,
        });
        await reload();
        showAlert('실패', error instanceof Error ? error.message : '처리에 실패했습니다.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!actionTarget) return;

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

  const handlePublishResource = async (resource: KemixResource) => {
    const resourceTitle = resource.title.trim() || '제목 없음';

    setSubmitting(true);
    setResources((prev) =>
      prev.map((item) => (item.id === resource.id ? { ...item, is_published: true } : item)),
    );

    try {
      await adminSetKemixResourcePublished(resource, true);
      showAlert('완료', `"${resourceTitle}" 자료가 공개되었습니다.`);
      await reload();
    } catch (error) {
      console.error('[AdminCommunityModeration] publish resource failed', {
        resourceId: resource.id,
        error,
      });
      await reload();
      showAlert('실패', error instanceof Error ? error.message : '공개 전환에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmTitle =
    confirmAction === 'delete'
      ? isResourceBoard
        ? '자료 삭제'
        : '게시글 삭제'
      : confirmAction === 'hide'
        ? isResourceBoard
          ? '자료 비공개'
          : '게시글 블라인드'
        : '';

  const confirmTargetTitle =
    resourceActionTarget?.title?.trim() ||
    actionTarget?.title?.trim() ||
    '제목 없음';

  const confirmMessage =
    confirmAction === 'delete'
      ? `"${confirmTargetTitle}" ${isResourceBoard ? '자료를' : '게시글을'} 영구 삭제하시겠습니까?`
      : confirmAction === 'hide'
        ? isResourceBoard
          ? `"${confirmTargetTitle}" 자료를 비공개 처리하시겠습니까?`
          : `"${confirmTargetTitle}" 게시글을 블라인드(숨김) 처리하시겠습니까?`
        : '';

  const emptyMessage = isResourceBoard
    ? includeHidden
      ? '등록된 자료가 없습니다.'
      : '표시할 공개 자료가 없습니다.'
    : includeHidden
      ? '등록된 게시글이 없습니다.'
      : '표시할 운영 중 게시글이 없습니다.';

  const filterLabel = isResourceBoard ? '비공개 자료 포함' : '블라인드 글 포함';

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

      <View className="mt-3 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-3 py-2.5">
        <View className="flex-1 pr-3">
          <Text className="text-sm font-semibold text-kemix-text">{filterLabel}</Text>
          <Text className="mt-0.5 text-[11px] text-kemix-text-secondary">
            {moderationBoardLabel(board)} 모니터링
          </Text>
        </View>
        <Switch value={includeHidden} onValueChange={setIncludeHidden} />
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : isResourceBoard ? (
        <FlatList
          data={displayedResources}
          keyExtractor={(item) => item.id}
          className="mt-3"
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-kemix-text-secondary">{emptyMessage}</Text>
          }
          renderItem={({ item }) => (
            <ResourceModerationCard
              resource={item}
              onUnpublish={(resource) => openResourceConfirm('hide', resource)}
              onPublish={(resource) => void handlePublishResource(resource)}
              onDelete={(resource) => openResourceConfirm('delete', resource)}
            />
          )}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          className="mt-3"
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-kemix-text-secondary">{emptyMessage}</Text>
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
        visible={!!confirmAction && !!(actionTarget || resourceActionTarget)}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmAction === 'delete' ? '삭제' : isResourceBoard ? '비공개' : '블라인드'}
        destructive={confirmAction === 'delete'}
        loading={submitting}
        onConfirm={() => void handleConfirm()}
        onCancel={() => {
          setConfirmAction(null);
          setActionTarget(null);
          setResourceActionTarget(null);
        }}
      />
    </View>
  );
}
