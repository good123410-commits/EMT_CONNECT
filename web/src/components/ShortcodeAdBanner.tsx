import { useEffect, useState } from 'react';
import { fetchActiveHomeEventBanners, type HomeBanner } from '../services/homeBannerService';

type ShortcodeAdBannerProps = {
  bannerId?: string;
};

function resolveBannerHref(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|tel:|mailto:|\/)/i.test(trimmed)) return trimmed;
  return trimmed;
}

export function ShortcodeAdBanner({ bannerId }: ShortcodeAdBannerProps) {
  const [banner, setBanner] = useState<HomeBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void fetchActiveHomeEventBanners()
      .then((rows) => {
        if (cancelled) return;
        if (bannerId) {
          setBanner(rows.find((row) => row.id === bannerId) ?? rows[0] ?? null);
          return;
        }
        setBanner(rows[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setBanner(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bannerId]);

  if (loading) {
    return <div className="community-shortcode-ad community-shortcode-ad--loading">광고 불러오는 중…</div>;
  }

  if (!banner) return null;

  const href = banner.linkUrl?.trim() ? resolveBannerHref(banner.linkUrl) : '';

  return (
    <a
      className="community-shortcode-ad"
      href={href || undefined}
      target={href && /^https?:\/\//i.test(href) ? '_blank' : undefined}
      rel={href && /^https?:\/\//i.test(href) ? 'noopener noreferrer' : undefined}
      onClick={href ? undefined : (event) => event.preventDefault()}
    >
      {banner.imageUrl ? (
        <img className="community-shortcode-ad__image" src={banner.imageUrl} alt={banner.title} />
      ) : (
        <div className="community-shortcode-ad__placeholder" aria-hidden>
          AD
        </div>
      )}
      <div className="community-shortcode-ad__body">
        <span className="community-shortcode-ad__eyebrow">Sponsored</span>
        <strong className="community-shortcode-ad__title">{banner.title}</strong>
        {banner.description?.trim() ? (
          <p className="community-shortcode-ad__desc">{banner.description}</p>
        ) : null}
        {href ? <span className="community-shortcode-ad__cta">자세히 보기 →</span> : null}
      </div>
    </a>
  );
}
