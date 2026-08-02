import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeKemiPostComments,
  subscribeKemiPostEngagement,
} from '@/lib/realtimeSubscription';
import {
  createKemiGuideComment,
  fetchKemiGuideComments,
  fetchKemiGuideEngagement,
  toggleKemiGuideLike,
} from '@/services/kemiGuideSocialService';
import type { KemiGuideComment, KemiGuideEngagement } from '@/types/kemiGuideSocial';

type UseKemiGuideEngagementResult = {
  engagement: KemiGuideEngagement;
  comments: KemiGuideComment[];
  loading: boolean;
  commentsLoading: boolean;
  likeLoading: boolean;
  commentSubmitting: boolean;
  error: string | null;
  reload: () => Promise<void>;
  toggleLike: () => Promise<void>;
  submitComment: (content: string, authorLabel?: string) => Promise<void>;
};

const DEFAULT_ENGAGEMENT: KemiGuideEngagement = {
  like_count: 0,
  comment_count: 0,
  liked: false,
};

export function useKemiGuideEngagement(postId: string | null): UseKemiGuideEngagementResult {
  const [engagement, setEngagement] = useState<KemiGuideEngagement>(DEFAULT_ENGAGEMENT);
  const [comments, setComments] = useState<KemiGuideComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setCommentsLoading(true);
    setError(null);
    try {
      const [nextEngagement, nextComments] = await Promise.all([
        fetchKemiGuideEngagement(postId),
        fetchKemiGuideComments(postId),
      ]);
      setEngagement(nextEngagement);
      setComments(nextComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : '참여 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setCommentsLoading(false);
    }
  }, [postId]);

  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      void reload();
    }, 280);
  }, [reload]);

  useEffect(() => {
    if (!postId) {
      setEngagement(DEFAULT_ENGAGEMENT);
      setComments([]);
      return;
    }

    void reload();
    const unsubComments = subscribeKemiPostComments(postId, scheduleReload);
    const unsubEngagement = subscribeKemiPostEngagement(postId, scheduleReload);

    return () => {
      unsubComments();
      unsubEngagement();
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
    };
  }, [postId, reload, scheduleReload]);

  const toggleLike = useCallback(async () => {
    if (!postId || likeLoading) return;
    setLikeLoading(true);
    setError(null);
    const prev = engagement;
    setEngagement({
      ...prev,
      liked: !prev.liked,
      like_count: Math.max(0, prev.like_count + (prev.liked ? -1 : 1)),
    });
    try {
      const next = await toggleKemiGuideLike(postId);
      setEngagement((current) => ({
        ...current,
        like_count: next.like_count,
        liked: next.liked,
      }));
    } catch (err) {
      setEngagement(prev);
      throw err;
    } finally {
      setLikeLoading(false);
    }
  }, [engagement, likeLoading, postId]);

  const submitComment = useCallback(
    async (content: string, authorLabel?: string) => {
      if (!postId || commentSubmitting) return;
      setCommentSubmitting(true);
      setError(null);
      try {
        const row = await createKemiGuideComment(postId, content, authorLabel);
        setComments((prev) => [...prev, row]);
        setEngagement((prev) => ({
          ...prev,
          comment_count: prev.comment_count + 1,
        }));
      } finally {
        setCommentSubmitting(false);
      }
    },
    [commentSubmitting, postId],
  );

  return {
    engagement,
    comments,
    loading,
    commentsLoading,
    likeLoading,
    commentSubmitting,
    error,
    reload,
    toggleLike,
    submitComment,
  };
}
