import type { CommunityReaction } from '@/types/community';

export type CommunityLikeableFields = {
  id: string;
  likes: number;
  my_reaction?: CommunityReaction | null;
  myReaction?: CommunityReaction | null;
};

export function getPostLikeReaction(item: CommunityLikeableFields): CommunityReaction | null {
  const reaction = item.my_reaction ?? item.myReaction ?? null;
  return reaction === 'like' || reaction === 'dislike' ? reaction : null;
}

export function isPostLiked(item: CommunityLikeableFields): boolean {
  return getPostLikeReaction(item) === 'like';
}

export function mergePostLikeState<T extends CommunityLikeableFields>(
  item: T,
  likes: number,
  myReaction: CommunityReaction | null,
): T {
  if ('my_reaction' in item) {
    return { ...item, likes, my_reaction: myReaction };
  }
  if ('myReaction' in item) {
    return { ...item, likes, myReaction: myReaction };
  }
  return { ...item, likes };
}

export function computeOptimisticLikeToggle(item: CommunityLikeableFields): {
  likes: number;
  myReaction: CommunityReaction | null;
} {
  const liked = isPostLiked(item);
  return {
    likes: Math.max(0, item.likes + (liked ? -1 : 1)),
    myReaction: liked ? null : 'like',
  };
}
