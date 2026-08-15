import { useCallback, useEffect, useState } from 'react';
import {
  createPostComment,
  fetchPostComments,
  parseCommunityError,
} from '@/services/communityService';
import { subscribeEmsPostComments } from '@/lib/realtimeSubscription';
import type { CommunityComment } from '@/types/community';

export function usePostComments(postId: string | null) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!postId) {
      setComments([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchPostComments(postId);
      setComments(rows);
      setError(null);
    } catch (err) {
      setComments([]);
      setError(parseCommunityError(err instanceof Error ? err.message : '댓글을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!postId) return;
    return subscribeEmsPostComments(postId, () => {
      void reload();
    });
  }, [postId, reload]);

  const submitComment = useCallback(
    async (content: string, authorLabel: string) => {
      if (!postId) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      const trimmed = content.trim();
      if (!trimmed) {
        throw new Error('내용을 입력해 주세요.');
      }

      setSubmitting(true);
      try {
        await createPostComment(postId, trimmed, null, authorLabel);
        await reload();
      } finally {
        setSubmitting(false);
      }
    },
    [postId, reload],
  );

  return {
    comments,
    loading,
    submitting,
    error,
    reload,
    submitComment,
  };
}
