import { formatPollEndsAt, getPollStatusLabel } from '../../services/pollService';
import type { Poll } from '../../types';

type PollCardProps = {
  poll: Poll;
  isAdmin?: boolean;
  onOpen: (poll: Poll) => void;
  onEdit?: (poll: Poll) => void;
  onDelete?: (poll: Poll) => void;
  onClosePoll?: (poll: Poll) => void;
};

export function PollCard({ poll, isAdmin, onOpen, onEdit, onDelete, onClosePoll }: PollCardProps) {
  const status = getPollStatusLabel(poll);
  const optionCount = poll.options?.length ?? 0;

  return (
    <article className="poll-card">
      <button type="button" className="poll-card-body" onClick={() => onOpen(poll)}>
        <div className="poll-card-top">
          <span className={`poll-status poll-status--${status.replace(/\s/g, '-')}`}>{status}</span>
          {!poll.is_published && isAdmin ? <span className="poll-badge">비공개</span> : null}
        </div>
        <h3 className="poll-card-title">{poll.title}</h3>
        {poll.description ? <p className="poll-card-desc">{poll.description}</p> : null}
        <div className="poll-card-meta">
          <span>항목 {optionCount}개</span>
          <span>총 {poll.total_votes ?? 0}표</span>
        </div>
        <p className="poll-card-ends">종료: {formatPollEndsAt(poll.ends_at)}</p>
        <span className="poll-card-cta">자세히 보기 / 투표하기</span>
      </button>

      {isAdmin ? (
        <div className="poll-card-admin">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit?.(poll)}>
            수정
          </button>
          {!poll.is_closed ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onClosePoll?.(poll)}>
              마감
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete?.(poll)}>
            삭제
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function PollCreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="poll-card poll-card--create" onClick={onClick}>
      <span className="poll-card-plus">+</span>
      <span className="poll-card-create-label">새 투표 안건</span>
    </button>
  );
}
