import { useEffect, useId, useState } from 'react';
import { extractFirstImageUrl } from '../utils/htmlContent';
import { formatInterviewMonth, fetchPublishedInterviewById } from '../services/interviewService';
import type { MonthlyInterview } from '../types';

type InterviewDetailModalProps = {
  interviewId: string | null;
  initialData?: MonthlyInterview | null;
  onClose: () => void;
};

function renderInterviewContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return <p className="interview-magazine-modal-empty">본문이 없습니다.</p>;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return <div className="interview-magazine-modal-body" dangerouslySetInnerHTML={{ __html: trimmed }} />;
  }
  return (
    <div className="interview-magazine-modal-body">
      {trimmed.split(/\n\n+/).map((block, i) => (
        <p key={i}>{block}</p>
      ))}
    </div>
  );
}

export function InterviewDetailModal({ interviewId, initialData, onClose }: InterviewDetailModalProps) {
  const titleId = useId();
  const [interview, setInterview] = useState<MonthlyInterview | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) return;

    setInterview(initialData ?? null);
    setError(null);

    if (initialData?.content?.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchPublishedInterviewById(interviewId)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setError('인터뷰를 찾을 수 없습니다.');
          setInterview(null);
          return;
        }
        setInterview(row);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '인터뷰를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [interviewId, initialData]);

  useEffect(() => {
    if (!interviewId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [interviewId, onClose]);

  if (!interviewId) return null;

  const coverUrl =
    interview?.thumbnail_url || (interview?.content ? extractFirstImageUrl(interview.content) : null);

  return (
    <div className="modal-overlay modal-overlay--magazine" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog--interview-magazine"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close modal-close--on-hero" onClick={onClose} aria-label="닫기">
          ×
        </button>

        {loading && !interview ? (
          <div className="interview-magazine-modal-loading">
            <p className="muted">불러오는 중…</p>
          </div>
        ) : null}
        {error ? <p className="error interview-magazine-modal-loading">{error}</p> : null}

        {interview ? (
          <article className="interview-magazine-modal">
            <header className="interview-magazine-modal-hero">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="interview-magazine-modal-cover" />
              ) : (
                <div className="interview-magazine-modal-cover interview-magazine-modal-cover--placeholder">🎙️</div>
              )}
              <div className="interview-magazine-modal-hero-overlay" />
              <div className="interview-magazine-modal-hero-content">
                {interview.published_month ? (
                  <span className="interview-magazine-modal-month">
                    {formatInterviewMonth(interview.published_month)}
                  </span>
                ) : null}
                <p className="interview-magazine-modal-guest">
                  <span className="interview-magazine-modal-guest-name">{interview.interviewee_name}</span>
                  {interview.interviewee_role ? (
                    <span className="interview-magazine-modal-guest-role">{interview.interviewee_role}</span>
                  ) : null}
                </p>
                <h2 id={titleId} className="interview-magazine-modal-title">
                  {interview.title}
                </h2>
              </div>
            </header>

            <div className="interview-magazine-modal-scroll">
              {interview.excerpt ? (
                <p className="interview-magazine-modal-lead">{interview.excerpt}</p>
              ) : null}
              {renderInterviewContent(interview.content)}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
