import { Link } from 'react-router-dom';
import { useGuides } from '../hooks/useGuides';
import { formatGuideDate } from '../services/guideService';

export function HomeGuideSection() {
  const { guides, loading, error } = useGuides(6);

  return (
    <section className="home-guides">
      <div className="section-head">
        <div>
          <p className="eyebrow">Live from Supabase</p>
          <h2>생활 응급처치 가이드</h2>
          <p className="section-desc">관리자가 발행한 글이 웹·앱에 실시간으로 동기화됩니다.</p>
        </div>
        <Link to="/blog" className="btn btn-outline">
          전체 보기
        </Link>
      </div>

      {loading ? <p className="muted">가이드 불러오는 중...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="post-grid">
        {guides.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`} className="post-card post-card--lift">
            {post.thumbnail_url ? (
              <img src={post.thumbnail_url} alt="" className="post-thumb" loading="lazy" />
            ) : (
              <div className="post-thumb post-thumb--placeholder">📋</div>
            )}
            <h3>{post.title}</h3>
            <time>{formatGuideDate(post.created_at)}</time>
            {post.seo_description ? <p>{post.seo_description}</p> : null}
          </Link>
        ))}
      </div>

      {!loading && guides.length === 0 ? (
        <p className="muted">아직 공개된 가이드가 없습니다. 관리자 대시보드에서 글을 발행해 주세요.</p>
      ) : null}
    </section>
  );
}
