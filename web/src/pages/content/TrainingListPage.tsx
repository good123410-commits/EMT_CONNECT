import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import {
  TRAINING_STATUS_LABEL,
  fetchTrainingCategories,
  fetchTrainings,
  formatTrainingPeriod,
  getTrainingCategoryLabel,
  type TrainingCategory,
} from '../../services/trainingService';
import type { KemixTraining } from '../../types';

export function TrainingListPage() {
  const [trainings, setTrainings] = useState<KemixTraining[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  useScrollToTop([category]);

  useEffect(() => {
    void fetchTrainingCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchTrainings({ category, search: query });
        if (!cancelled) setTrainings(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '교육 안내를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, query]);

  const filterCategories = useMemo(
    () => [{ slug: 'all', name: '전체', id: 'all', display_order: 0, is_active: true }, ...categories],
    [categories],
  );

  const resultLabel = useMemo(() => {
    if (loading) return '';
    return `총 ${trainings.length}건`;
  }, [loading, trainings.length]);

  return (
    <div className="content-section">
      <header className="content-section-head">
        <h2 className="content-section-title">KEMIX 교육 안내</h2>
        <p className="muted">교육 과정, 모집 공고 및 안내 자료를 확인하세요.</p>
      </header>

      <div className="guide-list-toolbar">
        <div className="guide-search">
          <span className="guide-search-icon" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            className="guide-search-input"
            placeholder="교육명·내용 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="교육 검색"
          />
          {search ? (
            <button type="button" className="guide-search-clear" onClick={() => setSearch('')} aria-label="검색어 지우기">
              ×
            </button>
          ) : null}
        </div>

        <nav className="guide-chips" aria-label="교육 카테고리">
          {filterCategories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              className={`guide-chip${category === cat.slug ? ' guide-chip--active' : ''}`}
              onClick={() => setCategory(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      </div>

      {resultLabel ? <p className="guide-result-label">{resultLabel}</p> : null}
      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="training-board">
        {trainings.map((item) => (
          <Link key={item.id} to={`/content/training/${item.id}`} className="training-board-row">
            <span className={`training-status training-status--${item.status}`}>
              [{TRAINING_STATUS_LABEL[item.status]}]
            </span>
            <span className="training-board-category">{getTrainingCategoryLabel(item.category, categories)}</span>
            <span className="training-board-title">{item.title}</span>
            <span className="training-board-date">{formatTrainingPeriod(item.training_start, item.training_end)}</span>
          </Link>
        ))}
      </div>

      {!loading && !error && trainings.length === 0 ? (
        <p className="muted">등록된 교육 안내가 없습니다.</p>
      ) : null}
    </div>
  );
}
