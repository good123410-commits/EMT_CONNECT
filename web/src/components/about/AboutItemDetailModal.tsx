import { useEffect } from 'react';
import type { KemixAboutItem } from '../../types';

type AboutItemDetailModalProps = {
  item: KemixAboutItem | null;
  open: boolean;
  onClose: () => void;
};

export function AboutItemDetailModal({ item, open, onClose }: AboutItemDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog modal-dialog--wide about-item-detail-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {item.badge_label ? <span className="about-item-badge">{item.badge_label}</span> : null}
        <h2 className="modal-title">{item.title}</h2>
        {item.summary ? <p className="about-item-detail-summary">{item.summary}</p> : null}

        <div
          className="prose-block rich-content about-item-detail-body"
          dangerouslySetInnerHTML={{ __html: item.content || '<p>상세 내용이 없습니다.</p>' }}
        />
      </div>
    </div>
  );
}
