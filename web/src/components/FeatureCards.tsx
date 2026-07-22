import { Link } from 'react-router-dom';

const FEATURES = [
  {
    to: '/content/interview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
      </svg>
    ),
    title: '이달의 인터뷰',
    description: '응급의료 현장의 혁신가들과의 깊이 있는 대화를 웹에서 만나보세요.',
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
    to: '/community/board',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'KEMIX 커뮤니티',
    description: '자유게시판, 스킬 테크 트리, 모금 안내까지 응급의료인을 위한 공간입니다.',
    tone: 'violet',
  },
] as const;

type FeatureCardsProps = {
  variant?: 'default' | 'hero';
};

export function FeatureCards({ variant = 'default' }: FeatureCardsProps) {
  const isHero = variant === 'hero';

  return (
    <section className={`feature-grid${isHero ? ' feature-grid--hero' : ''}`} aria-label="바로가기">
      {FEATURES.map((item) => (
        <Link
          key={item.title}
          to={item.to}
          className={`feature-card feature-card--${item.tone}${isHero ? ' feature-card--glass' : ''}`}
        >
          <div className="feature-icon">{item.icon}</div>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <span className="feature-link">자세히 보기 →</span>
        </Link>
      ))}
    </section>
  );
}
