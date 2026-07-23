import { useCallback, useEffect, useState } from 'react';
import { PageHero } from '../PageHero';
import { AboutSubNav } from '../AboutSubNav';
import { AboutItemCard } from './AboutItemCard';
import { AboutItemDetailModal } from './AboutItemDetailModal';
import { useAboutPage } from '../../hooks/useAboutPage';
import { fetchPublishedAboutItems } from '../../services/aboutItemService';
import type { AboutItemPageSlug, KemixAboutItem } from '../../types';

type AboutItemsPageViewProps = {
  pageSlug: AboutItemPageSlug;
};

export function AboutItemsPageView({ pageSlug }: AboutItemsPageViewProps) {
  const { page, loading: pageLoading } = useAboutPage(pageSlug);
  const [items, setItems] = useState<KemixAboutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KemixAboutItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchPublishedAboutItems(pageSlug));
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openItem = (item: KemixAboutItem) => {
    setSelected(item);
    setDetailOpen(true);
  };

  if (pageLoading || !page) {
    return (
      <div className="container page-content">
        <p className="muted">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <PageHero eyebrow={page.eyebrow} title={page.title} subtitle={page.subtitle ?? ''} dark />
      <AboutSubNav />

      {loading ? <p className="muted">항목을 불러오는 중…</p> : null}

      <div className="about-items-grid">
        {items.map((item) => (
          <AboutItemCard key={item.id} item={item} onOpen={openItem} />
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <p className="muted">표시할 항목이 없습니다.</p>
      ) : null}

      <AboutItemDetailModal
        item={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
