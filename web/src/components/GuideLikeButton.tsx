type GuideLikeButtonProps = {
  liked: boolean;
  count: number;
  loading?: boolean;
  onPress: () => void;
};

export function GuideLikeButton({ liked, count, loading, onPress }: GuideLikeButtonProps) {
  return (
    <button
      type="button"
      className={`guide-like-btn${liked ? ' guide-like-btn--active' : ''}`}
      disabled={loading}
      onClick={onPress}
      aria-pressed={liked}
      aria-label={`좋아요 ${count}개`}
    >
      <span className="guide-like-btn-icon" aria-hidden>
        {liked ? '♥' : '♡'}
      </span>
      <span className="guide-like-btn-count">{count}</span>
    </button>
  );
}
