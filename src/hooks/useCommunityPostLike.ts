import { useCallback, useRef } from 'react';
import { togglePostReaction, parseCommunityError } from '@/services/communityService';
import type { CommunityReaction } from '@/types/community';
import {
  computeOptimisticLikeToggle,
  mergePostLikeState,
  type CommunityLikeableFields,
} from '@/utils/communityPostLike';

type UseCommunityPostLikeOptions<T extends CommunityLikeableFields> = {
  patchPost: (id: string, updater: (prev: T) => T) => void;
  canLike?: () => boolean;
  onAuthRequired?: () => void;
  onError?: (message: string) => void;
};

export function useCommunityPostLike<T extends CommunityLikeableFields>({
  patchPost,
  canLike,
  onAuthRequired,
  onError,
}: UseCommunityPostLikeOptions<T>) {
  const pendingRef = useRef(new Set<string>());

  const toggleLike = useCallback(
    async (post: T) => {
      if (canLike && !canLike()) {
        onAuthRequired?.();
        return;
      }
      if (pendingRef.current.has(post.id)) return;

      const optimistic = computeOptimisticLikeToggle(post);
      const snapshot = post;

      patchPost(post.id, (prev) => mergePostLikeState(prev, optimistic.likes, optimistic.myReaction));

      pendingRef.current.add(post.id);
      try {
        const result = await togglePostReaction(post.id, 'like');
        patchPost(post.id, (prev) =>
          mergePostLikeState(prev, result.likes, result.my_reaction),
        );
      } catch (error) {
        patchPost(post.id, () => snapshot);
        const message = error instanceof Error ? error.message : 'like_failed';
        if (message.includes('not_authenticated')) {
          onAuthRequired?.();
          return;
        }
        onError?.(parseCommunityError(message));
      } finally {
        pendingRef.current.delete(post.id);
      }
    },
    [canLike, onAuthRequired, onError, patchPost],
  );

  const isPending = useCallback((postId: string) => pendingRef.current.has(postId), []);

  return { toggleLike, isPending };
}

export type { CommunityReaction };
