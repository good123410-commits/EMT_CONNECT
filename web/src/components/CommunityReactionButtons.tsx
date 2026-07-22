import type { CommunityReaction } from '../types';

type CommunityReactionButtonsProps = {
  likes: number;
  dislikes: number;
  myReaction: CommunityReaction | null;
  disabled?: boolean;
  compact?: boolean;
  onToggle: (reaction: CommunityReaction) => void;
};

export function CommunityReactionButtons({
  likes,
  dislikes,
  myReaction,
  disabled = false,
  compact = false,
  onToggle,
}: CommunityReactionButtonsProps) {
  return (
    <div className={`community-reactions${compact ? ' community-reactions--compact' : ''}`}>
      <button
        type="button"
        className={`community-reaction-btn${myReaction === 'like' ? ' community-reaction-btn--active-like' : ''}`}
        disabled={disabled}
        onClick={() => onToggle('like')}
        aria-pressed={myReaction === 'like'}
      >
        👍 좋아요 <span>{likes}</span>
      </button>
      <button
        type="button"
        className={`community-reaction-btn${myReaction === 'dislike' ? ' community-reaction-btn--active-dislike' : ''}`}
        disabled={disabled}
        onClick={() => onToggle('dislike')}
        aria-pressed={myReaction === 'dislike'}
      >
        👎 싫어요 <span>{dislikes}</span>
      </button>
    </div>
  );
}
