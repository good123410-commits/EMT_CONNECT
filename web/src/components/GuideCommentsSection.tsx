import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getCommunityDisplayName } from '../services/profileService';
import {
  formatGuideCommentTime,
  parseGuideSocialError,
} from '../services/guideSocialService';
import type { GuideComment } from '../types/guideSocial';
import { GuestLoginPrompt } from './GuestLoginPrompt';

type GuideCommentsSectionProps = {
  slug: string;
  comments: GuideComment[];
  commentCount?: number;
  loading?: boolean;
  submitting?: boolean;
  onSubmit: (content: string, authorLabel?: string) => Promise<void>;
};

export function GuideCommentsSection({
  slug,
  comments,
  commentCount,
  loading,
  submitting,
  onSubmit,
}: GuideCommentsSectionProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [draft, setDraft] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);

  const authorLabel = getCommunityDisplayName(profile, user?.email);

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!user) {
      setLoginOpen(true);
      return;
    }
    if (trimmed.length < 1) {
      showToast('댓글을 입력해 주세요.', 'error');
      return;
    }

    try {
      await onSubmit(trimmed, authorLabel);
      setDraft('');
      showToast('댓글이 등록되었습니다.');
    } catch (err) {
      showToast(
        parseGuideSocialError(err instanceof Error ? err.message : '다시 시도해 주세요.'),
        'error',
      );
    }
  };

  return (
    <section className="guide-comments" aria-label="댓글">
      <div className="guide-comments-head">
        <h2 className="guide-comments-title">댓글</h2>
        <span className="guide-comments-count">{commentCount ?? comments.length}개</span>
      </div>

      <div className="guide-comment-form">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            user ? '응급처치 경험이나 궁금한 점을 남겨 주세요.' : '댓글 작성은 로그인 후 가능합니다.'
          }
          rows={3}
          disabled={submitting}
        />
        <div className="guide-comment-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? '등록 중…' : '등록'}
          </button>
        </div>
      </div>

      <div className="guide-comment-list">
        {loading ? <p className="muted">댓글을 불러오는 중…</p> : null}
        {!loading && comments.length === 0 ? (
          <p className="muted guide-comments-empty">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</p>
        ) : null}
        {comments.map((comment) => (
          <article key={comment.id} className="guide-comment">
            <div className="guide-comment-head">
              <strong className="guide-comment-author">{comment.author_label}</strong>
              <time className="guide-comment-time">{formatGuideCommentTime(comment.created_at)}</time>
            </div>
            <p className="guide-comment-content">{comment.content}</p>
          </article>
        ))}
      </div>

      <GuestLoginPrompt
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="댓글 작성"
        description="로그인 후 댓글을 남길 수 있습니다."
        returnPath={`/blog/${slug}`}
        intent={{ type: 'guide-comment' }}
      />
    </section>
  );
}
