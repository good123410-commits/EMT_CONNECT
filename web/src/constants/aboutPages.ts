import type { AboutPageSlug } from '../types';

export type AboutPageFallback = {
  slug: AboutPageSlug;
  eyebrow: string;
  title: string;
  subtitle: string;
  content: string;
};

export const ABOUT_PAGE_META: Record<AboutPageSlug, { label: string; path: string }> = {
  vision: { label: '케믹스 비전', path: '/about/vision' },
  history: { label: '케믹스 연혁', path: '/about/history' },
  structure: { label: '케믹스 구성', path: '/about/structure' },
  'dev-log': { label: '개발일지', path: '/about/dev-log' },
};

export const ABOUT_PAGE_FALLBACKS: AboutPageFallback[] = [
  {
    slug: 'vision',
    eyebrow: 'About KEMIX',
    title: '케믹스 비전',
    subtitle: '대한민국 응급의료의 디지털 혁신을 선도합니다',
    content: `<h2>우리의 미션</h2>
<p>KEMIX(케믹스)는 응급의료 현장의 정보 비대칭을 해소하고, 대국민과 응급구조사·의료진을 하나의 플랫폼으로 연결합니다. 실시간 응급실 정보, 생활 응급처치 가이드, 전문 커뮤니티를 통해 누구나 응급상황에서 올바른 판단을 내릴 수 있도록 돕습니다.</p>
<h2>핵심 가치</h2>
<ul>
<li><strong>신뢰</strong> — 공공 데이터와 검증된 전문 콘텐츠 기반</li>
<li><strong>연결</strong> — 웹·모바일 앱 실시간 동기화</li>
<li><strong>혁신</strong> — 차세대 EMS 교육 및 표준화 추진</li>
<li><strong>공익</strong> — 응급의료 접근성 향상을 위한 지속적 투자</li>
</ul>`,
  },
  {
    slug: 'history',
    eyebrow: 'About KEMIX',
    title: '케믹스 연혁',
    subtitle: '응급의료 혁신의 발자취',
    content: `<div class="timeline">
<div class="timeline-item"><span class="timeline-year">2024</span><p class="timeline-event">EMS_Connect 모바일 앱 베타 출시</p></div>
<div class="timeline-item"><span class="timeline-year">2025</span><p class="timeline-event">실시간 응급실·병원 찾기 서비스 정식 오픈</p></div>
<div class="timeline-item"><span class="timeline-year">2025</span><p class="timeline-event">구급대원 커뮤니티 및 Q&A 시스템 구축</p></div>
<div class="timeline-item"><span class="timeline-year">2026</span><p class="timeline-event">KEMIX(케믹스) 브랜드 리뉴얼 및 공식 웹 플랫폼 런칭</p></div>
<div class="timeline-item"><span class="timeline-year">2026</span><p class="timeline-event">스킬 테크 트리 · 이달의 인터뷰 콘텐츠 확대</p></div>
</div>`,
  },
  {
    slug: 'structure',
    eyebrow: 'About KEMIX',
    title: '케믹스 구성',
    subtitle: '전문성과 협업으로 만드는 응급의료 생태계',
    content: `<div class="card-grid">
<article class="info-card"><h3>플랫폼 개발팀</h3><p>웹·모바일 앱, Supabase 백엔드, 실시간 데이터 연동</p></article>
<article class="info-card"><h3>콘텐츠·편집팀</h3><p>생활 응급처치 가이드, 이달의 인터뷰, SEO 콘텐츠</p></article>
<article class="info-card"><h3>EMS 커뮤니티팀</h3><p>구급대원 커뮤니티 운영, 모금·후원 관리</p></article>
<article class="info-card"><h3>의료 자문단</h3><p>응급의료 전문가 자문, 프로토콜 검수</p></article>
</div>`,
  },
  {
    slug: 'dev-log',
    eyebrow: 'About KEMIX',
    title: '개발일지',
    subtitle: 'KEMIX 플랫폼 업데이트 기록',
    content: `<div class="dev-log-list">
<article class="dev-log-item"><time>2026-07</time><h3>KEMIX 웹 플랫폼 v2.0</h3><p>오프닝 몽타주, GNB 개편, 모금 계좌 관리 시스템 구축</p></article>
<article class="dev-log-item"><time>2026-06</time><h3>실시간 통계 바 연동</h3><p>병원·가이드·구급대원 수 Supabase RPC 연동</p></article>
<article class="dev-log-item"><time>2026-05</time><h3>블로그 실시간 동기화</h3><p>kemi_posts Realtime으로 웹·앱 콘텐츠 공유</p></article>
<article class="dev-log-item"><time>2026-04</time><h3>KEMIX 브랜드 런칭</h3><p>KEMI에서 KEMIX로 리브랜딩</p></article>
</div>`,
  },
];

export function getAboutFallback(slug: AboutPageSlug) {
  return ABOUT_PAGE_FALLBACKS.find((p) => p.slug === slug);
}
