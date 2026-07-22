import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHero } from '../components/PageHero';
import { useGuideList } from '../hooks/useGuideList';
import {
  formatGuideDate,
  getGuideCategoryLabel,
  getGuideExcerpt,
} from '../services/guideService';

export function BlogListPage() {
  const {
    guides,
    categories,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    loading,
    error,
  } = useGuideList();

  const resultLabel = useMemo(() => {
    if (loading) return '';
    const cat = activeCategory === 'all' ? '전체' : categories.find((c) => c.slug === activeCategory)?.name;
    const parts: string[] = [];
    if (cat && activeCategory !== 'all') parts.push(cat);
    if (search.trim()) parts.push(`"${search.trim()}"`);
    return parts.length ? `${parts.join(' · ')} 검색 결과 ${guides.length}건` : `총 ${guides.length}건`;
  }, [loading, guides.length, activeCategory, categories, search]);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="Emergency Guide"
        title="생활 응급처치 가이드"
        subtitle="일상 속 응급상황에 필요한 의료 정보를 KEMIX 전문 콘텐츠로 제공합니다"
        dark
      />

      <div className="guide-list-toolbar">
        <div className="guide-search">
          <span className="guide-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="guide-search-input"
            placeholder="제목·본문 키워드 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="가이드 검색"
          />
          {search ? (
            <button type="button" className="guide-search-clear" onClick={() => setSearch('')} aria-label="검색어 지우기">
              ×
            </button>
          ) : null}
        </div>

        <nav className="guide-chips" aria-label="카테고리 필터">
          <button
            type="button"
            className={`guide-chip${activeCategory === 'all' ? ' guide-chip--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`guide-chip guide-chip--${cat.slug}${activeCategory === cat.slug ? ' guide-chip--active' : ''}`}
              onClick={() => setActiveCategory(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </div>

      {resultLabel ? <p className="guide-result-count">{resultLabel}</p> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="guide-list-grid">
        {guides.map((post) => {
          const excerpt = getGuideExcerpt(post);
          const catSlug = categories.find((c) => c.name === post.category)?.slug ?? 'general';
          return (
            <Link key={post.id} to={`/blog/${post.slug}`} className="guide-card">
              <div className="guide-card-media">
                {post.thumbnail_url ? (
                  <img src={post.thumbnail_url} alt="" className="guide-card-thumb" loading="lazy" />
                ) : (
                  <div className="guide-card-thumb guide-card-thumb--placeholder">📋</div>
                )}
                <span className={`guide-card-tag guide-card-tag--${catSlug}`}>
                  {getGuideCategoryLabel(post.category)}
                </span>
              </div>
              <div className="guide-card-body">
                <h2 className="guide-card-title">{post.title}</h2>
                {excerpt ? <p className="guide-card-excerpt">{excerpt}</p> : null}
                <footer className="guide-card-meta">
                  <time>{formatGuideDate(post.created_at)}</time>
                  <span>조회 {post.views.toLocaleString('ko-KR')}</span>
                </footer>
              </div>
            </Link>
          );
        })}
      </div>

      {!loading && guides.length === 0 ? (
        <div className="guide-empty">
          <p>조건에 맞는 가이드가 없습니다.</p>
          <p className="muted">다른 카테고리를 선택하거나 검색어를 변경해 보세요.</p>
        </div>
      ) : null}
    </div>
  );
}
