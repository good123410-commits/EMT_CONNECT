import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGuideComment,
  fetchGuideComments,
  fetchGuideEngagement,
  subscribeGuideSocial,
  toggleGuideLike,
} from '../services/guideSocialService';
import type { GuideComment, GuideEngagement } from '../types/guideSocial';

const DEFAULT_ENGAGEMENT: GuideEngagement = {
  like_count: 0,
  comment_count: 0,
  liked: false,
};

export function useGuideEngagement(postId: string | null) {
  const [engagement, setEngagement] = useState<GuideEngagement>(DEFAULT_ENGAGEMENT);
  const [comments, setComments] = useState<GuideComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reloadTimer = useRef<number | null>(null);
  const likeLoadingRef = useRef(false);

  const reload = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setCommentsLoading(true);
    setError(null);
    try {
      const [nextEngagement, nextComments] = await Promise.all([
        fetchGuideEngagement(postId),
        fetchGuideComments(postId),
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
    if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(() => {
      void reload();
    }, 320);
  }, [reload]);

  useEffect(() => {
    if (!postId) {
      setEngagement(DEFAULT_ENGAGEMENT);
      setComments([]);
      return;
    }

    void reload();
    const unsubscribe = subscribeGuideSocial(postId, scheduleReload);
    return () => {
      unsubscribe();
      if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current);
    };
  }, [postId, reload, scheduleReload]);

  const toggleLike = useCallback(async () => {
    if (!postId || likeLoadingRef.current) return;

    likeLoadingRef.current = true;
    setLikeLoading(true);
    setError(null);

    let previous = DEFAULT_ENGAGEMENT;
    setEngagement((prev) => {
      previous = prev;
      return {
        ...prev,
        liked: !prev.liked,
        like_count: Math.max(0, prev.like_count + (prev.liked ? -1 : 1)),
      };
    });

    try {
      const next = await toggleGuideLike(postId);
      setEngagement((current) => ({
        ...current,
        like_count: next.like_count,
        liked: next.liked,
      }));
    } catch (err) {
      setEngagement(previous);
      throw err;
    } finally {
      likeLoadingRef.current = false;
      setLikeLoading(false);
    }
  }, [postId]);

  const submitComment = useCallback(
    async (content: string, authorLabel?: string) => {
      if (!postId || commentSubmitting) return;
      setCommentSubmitting(true);
      setError(null);
      try {
        const row = await createGuideComment(postId, content, authorLabel);
        setComments((prev) => {
          if (prev.some((item) => item.id === row.id)) return prev;
          return [...prev, row];
        });
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
