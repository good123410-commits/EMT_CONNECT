import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  createPostComment,
  formatRelativeTime,
  submitCommunityReport,
  toggleCommentReaction,
} from '../services/communityService';
import { getCommunityDisplayName } from '../services/profileService';
import type { CommunityComment, CommunityReaction } from '../types';
import { CommunityReactionButtons } from './CommunityReactionButtons';
import { CommunityReportModal } from './CommunityReportModal';

type CommunityCommentSectionProps = {
  postId: string;
  comments: CommunityComment[];
  loading: boolean;
  onCommentsChange: () => void;
  onLoginRequired: () => void;
};

type ReportTarget = {
  type: 'comment';
  id: string;
  preview: string;
};

function CommentItem({
  comment,
  replies,
  user,
  profile,
  onLoginRequired,
  onCommentsChange,
  onReport,
  onReply,
}: {
  comment: CommunityComment;
  replies: CommunityComment[];
  user: ReturnType<typeof useAuth>['user'];
  profile: ReturnType<typeof useAuth>['profile'];
  onLoginRequired: () => void;
  onCommentsChange: () => void;
  onReport: (target: ReportTarget) => void;
  onReply: (parentId: string) => void;
}) {
  const { showToast } = useToast();
  const [likes, setLikes] = useState(comment.likes);
  const [dislikes, setDislikes] = useState(comment.dislikes);
  const [myReaction, setMyReaction] = useState(comment.my_reaction);
  const [reacting, setReacting] = useState(false);

  const handleReaction = async (reaction: CommunityReaction) => {
    if (!user) {
      onLoginRequired();
      return;
    }
    setReacting(true);
    try {
      const result = await toggleCommentReaction(comment.id, reaction);
      setLikes(result.likes);
      setDislikes(result.dislikes);
      setMyReaction(result.my_reaction);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '반응 처리에 실패했습니다.', 'error');
    } finally {
      setReacting(false);
    }
  };

  return (
    <div className="community-comment">
      <div className="community-comment-head">
        <div>
          <strong className="community-comment-author">{comment.anonymous_label}</strong>
          <time className="community-comment-time">{formatRelativeTime(comment.created_at)}</time>
        </div>
        <button
          type="button"
          className="community-report-link"
          onClick={() =>
            onReport({
              type: 'comment',
              id: comment.id,
              preview: comment.content.slice(0, 80),
            })
          }
        >
          🚨 신고
        </button>
      </div>
      <p className="community-comment-content">{comment.content}</p>
      <div className="community-comment-actions">
        <CommunityReactionButtons
          likes={likes}
          dislikes={dislikes}
          myReaction={myReaction}
          disabled={reacting}
          compact
          onToggle={(reaction) => void handleReaction(reaction)}
        />
        {!comment.parent_id ? (
          <button type="button" className="community-reply-btn" onClick={() => onReply(comment.id)}>
            답글 달기
          </button>
        ) : null}
      </div>

      {replies.length > 0 ? (
        <div className="community-comment-replies">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              user={user}
              profile={profile}
              onLoginRequired={onLoginRequired}
              onCommentsChange={onCommentsChange}
              onReport={onReport}
              onReply={onReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommunityCommentSection({
  postId,
  comments,
  loading,
  onCommentsChange,
  onLoginRequired,
}: CommunityCommentSectionProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reporting, setReporting] = useState(false);

  const { topLevel, repliesByParent } = useMemo(() => {
    const tops: CommunityComment[] = [];
    const replies = new Map<string, CommunityComment[]>();
    for (const comment of comments) {
      if (!comment.parent_id) {
        tops.push(comment);
      } else {
        const list = replies.get(comment.parent_id) ?? [];
        list.push(comment);
        replies.set(comment.parent_id, list);
      }
    }
    return { topLevel: tops, repliesByParent: replies };
  }, [comments]);

  const authorLabel = getCommunityDisplayName(profile, user?.email);

  const submitComment = async () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    if (!content.trim()) {
      showToast('댓글 내용을 입력해 주세요.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createPostComment(postId, content, replyParentId, authorLabel);
      setContent('');
      setReplyParentId(null);
      onCommentsChange();
      showToast(replyParentId ? '답글이 등록되었습니다.' : '댓글이 등록되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '댓글 등록에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async (reason: string) => {
    if (!reportTarget) return;
    setReporting(true);
    try {
      await submitCommunityReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason,
        preview: reportTarget.preview,
      });
      showToast('신고가 접수되었습니다.');
      setReportTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '신고 접수에 실패했습니다.', 'error');
    } finally {
      setReporting(false);
    }
  };

  return (
    <section className="community-comments">
      <h3 className="community-comments-title">댓글 {comments.length}</h3>

      {loading ? <p className="muted">댓글 불러오는 중…</p> : null}
      {!loading && topLevel.length === 0 ? <p className="muted">첫 댓글을 남겨 보세요.</p> : null}

      <div className="community-comment-list">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={repliesByParent.get(comment.id) ?? []}
            user={user}
            profile={profile}
            onLoginRequired={onLoginRequired}
            onCommentsChange={onCommentsChange}
            onReport={setReportTarget}
            onReply={(parentId) => {
              setReplyParentId(parentId);
              setContent('');
            }}
          />
        ))}
      </div>

      <div className="community-comment-form">
        {replyParentId ? (
          <p className="community-comment-replying">
            답글 작성 중{' '}
            <button type="button" className="community-reply-cancel" onClick={() => setReplyParentId(null)}>
              취소
            </button>
          </p>
        ) : null}
        <textarea
          className="modal-textarea"
          rows={3}
          placeholder={user ? '댓글을 입력해 주세요.' : '로그인 후 댓글을 작성할 수 있습니다.'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!user || submitting}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={!user || submitting}
          onClick={() => void submitComment()}
        >
          {submitting ? '등록 중…' : replyParentId ? '답글 등록' : '댓글 등록'}
        </button>
      </div>

      <CommunityReportModal
        open={Boolean(reportTarget)}
        title="댓글 신고하기"
        preview={reportTarget?.preview}
        saving={reporting}
        onClose={() => setReportTarget(null)}
        onSubmit={(reason) => void submitReport(reason)}
      />
    </section>
  );
}
