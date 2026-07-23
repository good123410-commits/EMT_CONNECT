import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { castPollVote, formatPollEndsAt, getPollStatusLabel } from '../../services/pollService';
import type { Poll } from '../../types';
import { canVoteInPolls, POLL_VOTE_GATE_MESSAGE } from '../../utils/membershipRbac';
import { getVotePercent } from './PollWriteModal';

type PollDetailModalProps = {
  poll: Poll | null;
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: (poll: Poll) => void;
  onEdit?: (poll: Poll) => void;
  onDelete?: (poll: Poll) => void;
  onClosePoll?: (poll: Poll) => void;
  onLoginRequired?: () => void;
};

export function PollDetailModal({
  poll,
  open,
  isAdmin,
  onClose,
  onUpdated,
  onEdit,
  onDelete,
  onClosePoll,
  onLoginRequired,
}: PollDetailModalProps) {
  const { profile, user } = useAuth();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [membershipGateOpen, setMembershipGateOpen] = useState(false);

  useEffect(() => {
    if (!open || !poll) return;
    setSelectedOptionId(poll.my_vote_option_id ?? null);
    setError(null);
    setShowResults(Boolean(poll.my_vote_option_id) || poll.is_closed || !poll.is_votable);
  }, [open, poll]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !poll) return null;

  const totalVotes = poll.total_votes ?? 0;
  const hasVoted = Boolean(poll.my_vote_option_id);
  const canVote = poll.is_votable && !hasVoted;
  const status = getPollStatusLabel(poll);

  const handleVote = async () => {
    if (!user) {
      onLoginRequired?.();
      setError('로그인 후 투표할 수 있습니다.');
      return;
    }
    if (!canVoteInPolls(profile)) {
      setMembershipGateOpen(true);
      return;
    }
    if (!selectedOptionId) {
      setError('투표할 항목을 선택해 주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await castPollVote(poll.id, selectedOptionId);
      onUpdated(updated);
      setShowResults(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '투표에 실패했습니다.';
      if (message.includes('login_required') || message.includes('JWT')) {
        onLoginRequired?.();
        setError('로그인 후 투표할 수 있습니다.');
      } else if (message.includes('already_voted')) {
        setError('이미 투표하셨습니다.');
        setShowResults(true);
      } else if (message.includes('poll_closed')) {
        setError('마감된 투표입니다.');
        setShowResults(true);
      } else if (message.includes('regular_member_required')) {
        setMembershipGateOpen(true);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog modal-dialog--wide poll-detail-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="poll-detail-header">
          <span className={`poll-status poll-status--${status.replace(/\s/g, '-')}`}>{status}</span>
          <h2 className="modal-title">{poll.title}</h2>
          <p className="poll-detail-meta">
            종료: {formatPollEndsAt(poll.ends_at)} · 총 {totalVotes}표
          </p>
        </div>

        {poll.description ? <p className="poll-detail-desc">{poll.description}</p> : null}

        {showResults || hasVoted || !canVote ? (
          <div className="poll-results">
            {poll.options
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((option) => {
                const percent = getVotePercent(option, totalVotes);
                const isMine = poll.my_vote_option_id === option.id;
                return (
                  <div key={option.id} className={`poll-result-row${isMine ? ' poll-result-row--mine' : ''}`}>
                    <div className="poll-result-head">
                      <span>{option.label}</span>
                      <span>{option.vote_count ?? 0}표 ({percent}%)</span>
                    </div>
                    <div className="poll-result-bar">
                      <div className="poll-result-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="poll-vote-options">
            {poll.options
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((option) => (
                <label key={option.id} className={`poll-vote-option${selectedOptionId === option.id ? ' poll-vote-option--selected' : ''}`}>
                  <input
                    type="radio"
                    name={`poll-${poll.id}`}
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    onChange={() => setSelectedOptionId(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
          </div>
        )}

        {error ? <p className="modal-error" role="alert">{error}</p> : null}

        <div className="poll-detail-actions">
          {canVote && !showResults ? (
            <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => void handleVote()}>
              {submitting ? '투표 중…' : '투표하기'}
            </button>
          ) : null}

          {!showResults && !hasVoted && !poll.is_votable ? (
            <button type="button" className="btn btn-secondary" onClick={() => setShowResults(true)}>
              결과 보기
            </button>
          ) : null}

          {isAdmin ? (
            <div className="poll-admin-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit?.(poll)}>
                수정
              </button>
              {!poll.is_closed ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onClosePoll?.(poll)}>
                  마감
                </button>
              ) : null}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowResults(true)}>
                결과 보기
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete?.(poll)}>
                삭제
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {membershipGateOpen ? (
        <div className="modal-overlay modal-overlay--nested" role="presentation" onClick={() => setMembershipGateOpen(false)}>
          <div
            className="modal-dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">투표 권한 안내</h3>
            <p className="modal-desc">{POLL_VOTE_GATE_MESSAGE}</p>
            <button type="button" className="btn btn-primary" onClick={() => setMembershipGateOpen(false)}>
              확인
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
