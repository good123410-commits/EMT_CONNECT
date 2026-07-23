import { useMemo, useState } from 'react';
import { DownloadSubNav } from '../../components/DownloadSubNav';
import { PageHero } from '../../components/PageHero';
import { ResourceDetailModal } from '../../components/ResourceDetailModal';
import { getResourceCategoryLabel } from '../../constants/resourceCategories';
import { useResources } from '../../hooks/useResources';
import { formatFileSize } from '../../services/resourceService';
import type { KemixResource } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function ResourcesPage() {
  const { resources, loading, error } = useResources();
  const [category, setCategory] = useState<string>('all');
  const [selected, setSelected] = useState<KemixResource | null>(null);

  const categories = useMemo(() => {
    const set = new Set(resources.map((r) => r.category));
    return ['all', ...Array.from(set)];
  }, [resources]);

  const filtered = useMemo(() => {
    if (category === 'all') return resources;
    return resources.filter((r) => r.category === category);
  }, [resources, category]);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="Resources & Q&A"
        title="자료실"
        subtitle="문서 안내, 서식, 지침 자료를 다운로드하거나 공유할 수 있습니다"
        dark
      />
      <DownloadSubNav />

      <p className="lead resources-intro">
        KEMIX에서 제공하는 공식 자료를 내려받거나 카카오톡·이메일로 전송할 수 있습니다.
      </p>

      {categories.length > 1 ? (
        <nav className="resource-filter-nav" aria-label="자료 카테고리">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`resource-filter-btn${category === cat ? ' resource-filter-btn--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? '전체' : getResourceCategoryLabel(cat)}
            </button>
          ))}
        </nav>
      ) : null}

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="resource-list" role="list" aria-label="자료 목록">
        <div className="resource-list-head" aria-hidden="true">
          <span className="resource-col resource-col--title">제목</span>
          <span className="resource-col resource-col--category">분류</span>
          <span className="resource-col resource-col--size">용량</span>
          <span className="resource-col resource-col--date">등록일</span>
        </div>

        {filtered.map((resource) => (
          <button
            key={resource.id}
            type="button"
            className="resource-row"
            role="listitem"
            onClick={() => setSelected(resource)}
          >
            <span className="resource-col resource-col--title">
              <strong>{resource.title}</strong>
              {resource.description ? (
                <span className="resource-row-desc">{resource.description}</span>
              ) : null}
            </span>
            <span className="resource-col resource-col--category">
              {getResourceCategoryLabel(resource.category)}
            </span>
            <span className="resource-col resource-col--size">{formatFileSize(resource.file_size)}</span>
            <span className="resource-col resource-col--date">{formatDate(resource.created_at)}</span>
          </button>
        ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="muted">등록된 자료가 없습니다.</p>
      ) : null}

      <ResourceDetailModal
        resource={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
