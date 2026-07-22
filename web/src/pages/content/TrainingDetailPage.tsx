import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  TRAINING_STATUS_LABEL,
  fetchTrainingById,
  formatTrainingPeriod,
  getTrainingCategoryLabel,
} from '../../services/trainingService';
import type { KemixTraining } from '../../types';

export function TrainingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [training, setTraining] = useState<KemixTraining | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchTrainingById(id);
        if (!cancelled) setTraining(row);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '불러오기 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="muted">불러오는 중…</p>;
  }

  if (error || !training) {
    return (
      <div className="content-section">
        <p className="error">{error ?? '교육 안내를 찾을 수 없습니다.'}</p>
        <Link to="/content/training" className="btn btn-secondary">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <article className="content-section training-detail">
      <Link to="/content/training" className="training-detail-back">
        ← 교육 안내 목록
      </Link>

      <header className="training-detail-header">
        <div className="training-detail-badges">
          <span className={`training-status training-status--${training.status}`}>
            [{TRAINING_STATUS_LABEL[training.status]}]
          </span>
          <span className="training-board-category">{getTrainingCategoryLabel(training.category)}</span>
        </div>
        <h1 className="training-detail-title">{training.title}</h1>
        <p className="training-detail-period">
          교육 기간: {formatTrainingPeriod(training.training_start, training.training_end)}
        </p>
      </header>

      {training.excerpt ? <p className="training-detail-excerpt">{training.excerpt}</p> : null}

      {training.content ? (
        <div
          className="training-detail-content rich-content"
          dangerouslySetInnerHTML={{ __html: training.content }}
        />
      ) : null}

      <div className="training-detail-actions">
        {training.apply_url ? (
          <a href={training.apply_url} className="btn btn-primary" target="_blank" rel="noreferrer">
            신청하기
          </a>
        ) : null}
        {training.attachment_url ? (
          <a href={training.attachment_url} className="btn btn-secondary" target="_blank" rel="noreferrer">
            첨부파일 / 안내문
          </a>
        ) : null}
      </div>
    </article>
  );
}
