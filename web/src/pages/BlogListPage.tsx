import { AdSenseSlot } from '../components/AdSenseSlot';
import { useGuides } from '../hooks/useGuides';
import { formatGuideDate } from '../services/guideService';
import { Link } from 'react-router-dom';

export function BlogListPage() {
  const { guides, loading, error } = useGuides(50);

  return (
    <div className="blog-list">
      <AdSenseSlot slotId="blog-list-top" className="mb-6" />

      <h1>생활 응급처치 가이드</h1>
      <p className="lead">일상 속 응급상황에 필요한 의료 정보를 KEMI 전문 콘텐츠로 제공합니다.</p>

      {loading ? <p className="muted">불러오는 중...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="post-grid">
        {guides.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`} className="post-card post-card--lift">
            {post.thumbnail_url ? (
              <img src={post.thumbnail_url} alt="" className="post-thumb" loading="lazy" />
            ) : (
              <div className="post-thumb post-thumb--placeholder">📋</div>
            )}
            <h2>{post.title}</h2>
            <time>{formatGuideDate(post.created_at)}</time>
            {post.seo_description ? <p>{post.seo_description}</p> : null}
          </Link>
        ))}
      </div>

      {!loading && guides.length === 0 ? (
        <p className="muted">아직 공개된 글이 없습니다.</p>
      ) : null}
    </div>
  );
}
