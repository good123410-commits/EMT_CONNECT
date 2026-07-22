import { useState } from 'react';
import { InterviewDetailModal } from '../components/InterviewDetailModal';
import { useInterviews } from '../hooks/useInterviews';
import { formatInterviewMonth } from '../services/interviewService';

export function InterviewPage() {
  const { interviews, loading, error } = useInterviews(24);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedInterview = interviews.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="content-section">
      <header className="content-section-head">
        <h2 className="content-section-title">이달의 인터뷰</h2>
        <p className="muted">응급의료 현장의 혁신가들을 만나다</p>
      </header>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="interview-grid">
        {interviews.map((item) => (
          <article
            key={item.id}
            className="interview-card interview-card--clickable"
            role="button"
            tabIndex={0}
            onClick={() => setSelectedId(item.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedId(item.id);
              }
            }}
          >
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt="" className="interview-card-img" />
            ) : (
              <div className="interview-card-img interview-card-img--placeholder">🎙️</div>
            )}
            <div className="interview-card-body">
              {item.published_month ? (
                <span className="interview-month">{formatInterviewMonth(item.published_month)}</span>
              ) : null}
              <h3>{item.title}</h3>
              <p className="interview-guest">
                {item.interviewee_name}
                {item.interviewee_role ? ` · ${item.interviewee_role}` : ''}
              </p>
              {item.excerpt ? <p className="interview-excerpt">{item.excerpt}</p> : null}
            </div>
          </article>
        ))}
      </div>

      {!loading && interviews.length === 0 ? (
        <p className="muted">아직 공개된 인터뷰가 없습니다.</p>
      ) : null}

      <InterviewDetailModal
        interviewId={selectedId}
        initialData={selectedInterview}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
