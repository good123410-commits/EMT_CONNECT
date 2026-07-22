import { Link } from 'react-router-dom';

const FEATURES = [
  {
    to: '/facilities',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    title: '실시간 응급실 정보',
    description: '공공 API와 KEMI 자체 데이터를 결합해 병상·장비·당직 연락처를 제공합니다.',
    tone: 'emerald',
  },
  {
    to: '/blog',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: '생활 응급처치 가이드',
    description: '웹과 모바일 앱에서 동일한 Supabase 콘텐츠를 실시간으로 공유합니다.',
    tone: 'sky',
  },
  {
    to: '/facilities',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'EMS 커뮤니티',
    description: '구급대원·응급의료 종사자를 위한 전문 커뮤니티 앱을 함께 제공합니다.',
    tone: 'violet',
  },
] as const;

export function FeatureCards() {
  return (
    <section className="feature-grid">
      {FEATURES.map((item) => (
        <Link key={item.title} to={item.to} className={`feature-card feature-card--${item.tone}`}>
          <div className="feature-icon">{item.icon}</div>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <span className="feature-link">자세히 보기 →</span>
        </Link>
      ))}
    </section>
  );
}
