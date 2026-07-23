import { useState } from 'react';
import { getResourceCategoryLabel } from '../constants/resourceCategories';
import { formatFileSize } from '../services/resourceService';
import { isKakaoShareAvailable, shareResourceOnKakao } from '../utils/kakaoShare';
import type { KemixResource } from '../types';
import { ResourceEmailModal } from './ResourceEmailModal';

type ResourceDetailModalProps = {
  resource: KemixResource | null;
  open: boolean;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function ResourceDetailModal({ resource, open, onClose }: ResourceDetailModalProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  if (!open || !resource) return null;

  const handleKakaoShare = () => {
    setShareError(null);
    const err = shareResourceOnKakao(resource);
    if (err) setShareError(err);
  };

  return (
    <>
      <div className="modal-overlay" role="presentation" onClick={onClose}>
        <div
          className="modal-card resource-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-detail-title"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>

          <header className="resource-detail-header">
            <span className="resource-detail-category">{getResourceCategoryLabel(resource.category)}</span>
            <h2 id="resource-detail-title" className="resource-detail-title">
              {resource.title}
            </h2>
            <p className="resource-detail-meta">
              {formatDate(resource.created_at)} · {resource.file_name} · {formatFileSize(resource.file_size)}
            </p>
          </header>

          {resource.description ? (
            <p className="resource-detail-desc">{resource.description}</p>
          ) : null}

          <div className="resource-detail-actions">
            <a
              href={resource.file_url}
              className="btn btn-primary"
              download={resource.file_name}
              target="_blank"
              rel="noopener noreferrer"
            >
              파일 다운로드
            </a>
            {isKakaoShareAvailable() ? (
              <button type="button" className="btn btn-kakao" onClick={handleKakaoShare}>
                카카오톡으로 공유
              </button>
            ) : null}
            <button type="button" className="btn btn-secondary" onClick={() => setEmailOpen(true)}>
              이메일로 전송
            </button>
          </div>

          {shareError ? <p className="modal-error">{shareError}</p> : null}
        </div>
      </div>

      <ResourceEmailModal
        resource={resource}
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
      />
    </>
  );
}
