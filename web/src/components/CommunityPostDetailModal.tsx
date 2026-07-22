import { useCallback, useEffect, useId, useState } from 'react';
import { getCategoryLabel } from '../constants/communityBoard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  fetchMyPostReaction,
  fetchPostComments,
  formatRelativeTime,
  submitCommunityReport,
  togglePostReaction,
} from '../services/communityService';
import type { CommunityComment, CommunityPost, CommunityReaction } from '../types';
import { CommunityCommentSection } from './CommunityCommentSection';
import { CommunityReactionButtons } from './CommunityReactionButtons';
import { CommunityReportModal } from './CommunityReportModal';

type CommunityPostDetailModalProps = {
  post: CommunityPost | null;
  onClose: () => void;
  onPostUpdate?: (postId: string, patch: Partial<CommunityPost>) => void;
  onLoginRequired?: () => void;
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

export function CommunityPostDetailModal({
  post,
  onClose,
  onPostUpdate,
  onLoginRequired,
}: CommunityPostDetailModalProps) {
  const titleId = useId();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState<CommunityReaction | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [reacting, setReacting] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);

  const loadComments = useCallback(async () => {
    if (!post) return;
    setCommentsLoading(true);
    try {
      const rows = await fetchPostComments(post.id);
      setComments(rows);
      setCommentCount(rows.length);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [post]);

  useEffect(() => {
    if (!post) return undefined;

    setLikes(post.likes);
    setDislikes(post.dislikes ?? 0);
    setMyReaction(post.my_reaction ?? null);
    setCommentCount(post.comment_count ?? 0);

    void (async () => {
      if (user) {
        const reaction = await fetchMyPostReaction(post.id);
        setMyReaction(reaction);
      }
    })();

    void loadComments();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [post, user, onClose, loadComments]);

  if (!post) return null;

  const handleReaction = async (reaction: CommunityReaction) => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    setReacting(true);
    try {
      const result = await togglePostReaction(post.id, reaction);
      setLikes(result.likes);
      setDislikes(result.dislikes);
      setMyReaction(result.my_reaction);
      onPostUpdate?.(post.id, {
        likes: result.likes,
        dislikes: result.dislikes,
        my_reaction: result.my_reaction,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : '반응 처리에 실패했습니다.', 'error');
    } finally {
      setReacting(false);
    }
  };

  const handleReport = async (reason: string) => {
    setReporting(true);
    try {
      await submitCommunityReport({
        targetType: 'post',
        targetId: post.id,
        reason,
        preview: post.title ?? post.content.slice(0, 80),
      });
      showToast('신고가 접수되었습니다.');
      setReportOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '신고 접수에 실패했습니다.', 'error');
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <div className="modal-overlay modal-overlay--community" role="presentation" onClick={onClose}>
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
              <button type="button" className="community-report-link" onClick={() => setReportOpen(true)}>
                🚨 신고하기
              </button>
            </div>
            <h2 id={titleId} className="community-post-detail-title">
              {post.title?.trim() || '제목 없음'}
            </h2>
            <p className="community-post-detail-author">{post.anonymous_label}</p>
          </header>

          <div className="community-post-detail-scroll">
            {renderPostContent(post.content)}

            <div className="community-post-detail-reactions">
              <CommunityReactionButtons
                likes={likes}
                dislikes={dislikes}
                myReaction={myReaction}
                disabled={reacting}
                onToggle={(reaction) => void handleReaction(reaction)}
              />
              <span className="community-post-detail-comment-count">💬 댓글 {commentCount}</span>
            </div>

            <CommunityCommentSection
              postId={post.id}
              comments={comments}
              loading={commentsLoading}
              onCommentsChange={async () => {
                setCommentsLoading(true);
                try {
                  const rows = await fetchPostComments(post.id);
                  setComments(rows);
                  setCommentCount(rows.length);
                  onPostUpdate?.(post.id, { comment_count: rows.length });
                } finally {
                  setCommentsLoading(false);
                }
              }}
              onLoginRequired={() => onLoginRequired?.()}
            />
          </div>
        </div>
      </div>

      <CommunityReportModal
        open={reportOpen}
        title="게시글 신고하기"
        preview={post.title ?? undefined}
        saving={reporting}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => void handleReport(reason)}
      />
    </>
  );
}
