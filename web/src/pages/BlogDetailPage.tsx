import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import {
  fetchGuideBySlug,
  fetchGuideCategories,
  formatGuideDate,
  getGuideCategoryLabel,
  subscribeGuides,
  type KemixGuide,
} from '../services/guideService';

const APP_DEEP_LINK = import.meta.env.VITE_APP_DEEP_LINK ?? 'emtconnect://guide';
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL ?? '/download/app';

function renderGuideContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return <p className="muted">본문이 없습니다.</p>;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return <div className="guide-detail-body" dangerouslySetInnerHTML={{ __html: trimmed }} />;
  }
  return (
    <div className="guide-detail-body">
      {trimmed.split(/\n\n+/).map((block, i) => (
        <p key={i}>{block}</p>
      ))}
    </div>
  );
}

export function BlogDetailPage() {
  const { slug = '' } = useParams();
  const { showToast } = useToast();
  const [post, setPost] = useState<KemixGuide | null>(null);
  const [categorySlug, setCategorySlug] = useState('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const row = await fetchGuideBySlug(slug);
        setPost(row);
        if (row) {
          const cats = await fetchGuideCategories();
          setCategorySlug(cats.find((c) => c.name === row.category)?.slug ?? 'general');
          document.title = row.seo_title || `${row.title} | KEMIX`;
          const desc = row.seo_description ?? row.summary;
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

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.summary ?? post.seo_description ?? '', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('링크가 클립보드에 복사되었습니다.');
    } catch {
      showToast('공유에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="guide-detail-read">
        <p className="muted">불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guide-detail-read">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="guide-detail-read">
        <p>글을 찾을 수 없습니다.</p>
        <Link to="/blog" className="guide-back-btn">
          ← 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const categoryLabel = getGuideCategoryLabel(post.category);

  return (
    <article className="guide-detail-read">
      <Link to="/blog" className="guide-back-btn">
        ← 목록으로 돌아가기
      </Link>

      <header className="guide-detail-header">
        <h1 className="guide-detail-title">{post.title}</h1>
        <div className="guide-detail-meta">
          <time>{formatGuideDate(post.created_at)}</time>
          <span className="guide-detail-meta-sep">·</span>
          <span>조회 {post.views.toLocaleString('ko-KR')}</span>
          <span className="guide-detail-meta-sep">·</span>
          <span className={`guide-detail-category guide-detail-category--${categorySlug}`}>
            {categoryLabel}
          </span>
        </div>
      </header>

      {post.thumbnail_url ? (
        <img src={post.thumbnail_url} alt="" className="guide-detail-hero" />
      ) : null}

      {renderGuideContent(post.content)}

      <footer className="guide-detail-actions">
        <Link to="/blog" className="btn btn-secondary">
          목록으로
        </Link>
        <button type="button" className="btn btn-outline" onClick={() => void handleShare()}>
          공유하기
        </button>
        <a href={APP_STORE_URL !== '#' ? APP_STORE_URL : APP_DEEP_LINK} className="btn btn-primary">
          앱에서 보기
        </a>
      </footer>
    </article>
  );
}
