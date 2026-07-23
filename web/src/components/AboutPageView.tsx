import { PageHero } from '../components/PageHero';
import { AboutSubNav } from './AboutSubNav';
import { useAboutPage } from '../hooks/useAboutPage';
import type { AboutPageSlug } from '../types';

type AboutPageViewProps = {
  slug: AboutPageSlug;
};

export function AboutPageView({ slug }: AboutPageViewProps) {
  const { page, loading } = useAboutPage(slug);

  if (loading || !page) {
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
      <div
        className="prose-block rich-content about-page-body"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
