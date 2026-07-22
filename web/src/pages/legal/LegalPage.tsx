import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHero } from '../../components/PageHero';
import { fetchSiteSetting } from '../../services/siteSettingsService';
import type { SiteSettingKey } from '../../types';

const KEY_MAP: Record<string, SiteSettingKey> = {
  privacy: 'privacy_policy',
  terms: 'terms_of_service',
  service: 'service_info',
};

export function LegalPage() {
  const { slug = 'privacy' } = useParams();
  const settingKey = KEY_MAP[slug] ?? 'privacy_policy';
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const row = await fetchSiteSetting(settingKey);
        if (!cancelled) setPage({ title: row.title, content: row.content });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settingKey]);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX"
        title={page?.title ?? '문서'}
        subtitle="서비스 정책 및 안내"
        dark
      />
      {loading ? (
        <p className="muted">불러오는 중…</p>
      ) : (
        <div
          className="prose-block rich-content legal-page-body"
          dangerouslySetInnerHTML={{ __html: page?.content ?? '' }}
        />
      )}
    </div>
  );
}
