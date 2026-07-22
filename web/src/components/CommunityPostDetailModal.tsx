import { useEffect, useId } from 'react';
import { getCategoryLabel } from '../constants/communityBoard';
import { formatRelativeTime } from '../services/communityService';
import type { CommunityPost } from '../types';

type CommunityPostDetailModalProps = {
  post: CommunityPost | null;
  onClose: () => void;
};

function renderPostContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return <p className="muted">본문이 없습니다.</p>;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return <div className="community-post-detail-body" dangerouslySetInnerHTML={{ __html: trimmed }} />;
  }
  return (
    <div className="community-post-detail-body">
      {trimmed.split(/\n\n+/).map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </div>
  );
}

export function CommunityPostDetailModal({ post, onClose }: CommunityPostDetailModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!post) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [post, onClose]);

  if (!post) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog community-post-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <header className="community-post-detail-header">
          <div className="community-post-detail-meta">
            <span className={`board-tag board-tag--${post.category_slug ?? 'free'}`}>
              {getCategoryLabel(post.category_slug, post.category_name)}
            </span>
            {post.is_notice ? <span className="board-notice">공지</span> : null}
            {post.is_hot ? <span className="board-hot">HOT</span> : null}
            <time className="community-post-detail-time">{formatRelativeTime(post.created_at)}</time>
          </div>
          <h2 id={titleId} className="community-post-detail-title">
            {post.title?.trim() || '제목 없음'}
          </h2>
          <p className="community-post-detail-author">{post.anonymous_label}</p>
        </header>

        <div className="community-post-detail-scroll">{renderPostContent(post.content)}</div>

        <footer className="community-post-detail-foot">
          <span title="좋아요">👍 {post.likes}</span>
          <span title="댓글">💬 {post.comment_count ?? 0}</span>
        </footer>
      </div>
    </div>
  );
}
