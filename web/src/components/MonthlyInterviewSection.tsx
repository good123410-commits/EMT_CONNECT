import { type CSSProperties, type ReactNode, type Ref, useState } from 'react';
import { Link } from 'react-router-dom';
import { FeatureCards } from './FeatureCards';
import { InterviewDetailModal } from './InterviewDetailModal';
import { stripHtml } from './RichTextEditor';
import { useInterviews } from '../hooks/useInterviews';
import { formatInterviewHeroTag } from '../services/interviewService';

type InterviewHeroShellProps = {
  children: ReactNode;
  bgStyle?: CSSProperties;
  shellRef?: Ref<HTMLElement>;
  stateClass?: string;
};

function InterviewHeroShell({
  children,
  bgStyle,
  shellRef,
  stateClass = '',
}: InterviewHeroShellProps) {
  return (
    <section
      ref={shellRef}
      className={`interview-hero interview-hero--visible${stateClass ? ` ${stateClass}` : ''}`}
    >
      <div className="interview-hero-bg" style={bgStyle} aria-hidden />
      <div className="interview-hero-overlay" aria-hidden />

      <div className="interview-hero-inner">
        <div className="interview-hero-body">{children}</div>
        <FeatureCards variant="hero" />
      </div>
    </section>
  );
}

export function MonthlyInterviewSection() {
  const { featured, loading, error } = useInterviews(1);
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <InterviewHeroShell stateClass="interview-hero--loading">
        <p className="interview-hero-status">이달의 인터뷰를 불러오는 중…</p>
      </InterviewHeroShell>
    );
  }

  if (error || !featured?.title || !featured?.published_month) {
    return (
      <InterviewHeroShell stateClass="interview-hero--empty">
        <div className="interview-hero-card interview-hero-card--static">
          <span className="interview-hero-tag">🎤 이달의 인터뷰</span>
          <h2 className="interview-hero-title">이달의 인터뷰</h2>
          <p className="interview-hero-excerpt">곧 새로운 인터뷰가 공개됩니다. 응급의료 현장의 혁신가들을 만나보세요.</p>
        </div>
      </InterviewHeroShell>
    );
  }

  const bgStyle = featured.thumbnail_url
    ? { backgroundImage: `url("${featured.thumbnail_url}")` }
    : undefined;

  const summary =
    featured.excerpt?.trim() ||
    stripHtml(featured.content).slice(0, 220) ||
    '';

  const guestLine = featured.interviewee_role
    ? `${featured.interviewee_name} · ${featured.interviewee_role}`
    : featured.interviewee_name;

  return (
    <>
      <InterviewHeroShell bgStyle={bgStyle}>
        <article className="interview-hero-card" aria-labelledby="home-interview-title">
          <span className="interview-hero-tag">
            {formatInterviewHeroTag(featured.published_month)}
          </span>

          <h2 id="home-interview-title" className="interview-hero-title">
            {featured.title}
          </h2>

          <p className="interview-hero-guest">{guestLine}</p>

          {summary ? <p className="interview-hero-excerpt">{summary}</p> : null}

          <div className="interview-hero-actions">
            <button
              type="button"
              className="btn btn-hero-primary interview-hero-cta"
              onClick={() => setModalOpen(true)}
            >
              자세히 보기 →
            </button>
            <Link to="/content/interview" className="interview-hero-link">
              다른 인터뷰 보기
            </Link>
          </div>
        </article>
      </InterviewHeroShell>

      <InterviewDetailModal
        interviewId={modalOpen ? featured.id : null}
        initialData={featured}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
