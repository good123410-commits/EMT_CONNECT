import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdSenseSlot } from '../components/AdSenseSlot';
import { fetchGuideBySlug, formatGuideDate, subscribeGuides, type KemiGuide } from '../services/guideService';

export function BlogDetailPage() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<KemiGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const row = await fetchGuideBySlug(slug);
        setPost(row);
        if (row) {
          document.title = row.seo_title || `${row.title} | KEMI`;
          const desc = row.seo_description;
          if (desc) {
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
              meta = document.createElement('meta');
              meta.setAttribute('name', 'description');
              document.head.appendChild(meta);
            }
            meta.setAttribute('content', desc);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '글을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribeGuides(() => {
      void load();
    });
    return unsubscribe;
  }, [slug]);

  if (loading) return <p className="muted">불러오는 중...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!post) {
    return (
      <div>
        <p>글을 찾을 수 없습니다.</p>
        <Link to="/blog">목록으로</Link>
      </div>
    );
  }

  const blocks = post.content.split(/\n\n+/);

  return (
    <article className="blog-detail">
      <AdSenseSlot slotId="blog-detail-top" className="mb-6" />

      <Link to="/blog" className="back-link">
        ← 목록
      </Link>
      <h1>{post.title}</h1>
      <p className="meta">
        {formatGuideDate(post.created_at)} · 조회 {post.views.toLocaleString('ko-KR')}
      </p>

      <div className="post-body">
        {blocks.map((block, index) => {
          if (index === Math.floor(blocks.length / 2) && blocks.length > 2) {
            return (
              <div key={`ad-${index}`}>
                <AdSenseSlot slotId="blog-detail-mid" className="my-8" />
                <div className="post-block" dangerouslySetInnerHTML={{ __html: block }} />
              </div>
            );
          }
          return (
            <div key={index} className="post-block" dangerouslySetInnerHTML={{ __html: block }} />
          );
        })}
      </div>

      <AdSenseSlot slotId="blog-detail-bottom" className="mt-10" />
    </article>
  );
}
