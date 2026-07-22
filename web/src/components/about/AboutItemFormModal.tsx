import { useEffect, useState } from 'react';
import { RichTextEditor } from '../RichTextEditor';
import { ABOUT_ITEM_PAGE_META } from '../../constants/aboutItemFallbacks';
import type { AboutItemPageSlug, KemixAboutItem } from '../../types';

export type AboutItemFormState = {
  badge_label: string;
  title: string;
  summary: string;
  content: string;
  display_order: number;
  is_published: boolean;
};

export const EMPTY_ABOUT_ITEM_FORM: AboutItemFormState = {
  badge_label: '',
  title: '',
  summary: '',
  content: '',
  display_order: 0,
  is_published: true,
};

export function aboutItemToForm(item: KemixAboutItem): AboutItemFormState {
  return {
    badge_label: item.badge_label ?? '',
    title: item.title,
    summary: item.summary,
    content: item.content,
    display_order: item.display_order,
    is_published: item.is_published,
  };
}

type AboutItemFormModalProps = {
  open: boolean;
  pageSlug: AboutItemPageSlug;
  initial: AboutItemFormState;
  saving: boolean;
  onClose: () => void;
  onSave: (form: AboutItemFormState) => void;
  onUploadError?: (message: string) => void;
};

export function AboutItemFormModal({
  open,
  pageSlug,
  initial,
  saving,
  onClose,
  onSave,
  onUploadError,
}: AboutItemFormModalProps) {
  const [form, setForm] = useState<AboutItemFormState>(initial);
  const meta = ABOUT_ITEM_PAGE_META[pageSlug];

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

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

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog modal-dialog--wide"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="modal-title">항목 {initial.title ? '수정' : '추가'}</h2>
        <p className="modal-desc">{meta.label} 개별 카드 항목을 작성합니다.</p>

        <div className="poll-form">
          <label className="modal-label">
            {meta.badgeLabel}
            <input
              className="modal-input"
              value={form.badge_label}
              onChange={(e) => setForm((p) => ({ ...p, badge_label: e.target.value }))}
              placeholder={meta.badgePlaceholder}
            />
          </label>

          <label className="modal-label">
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="카드에 표시될 제목"
            />
          </label>

          <label className="modal-label">
            요약 (카드 미리보기)
            <textarea
              className="modal-input poll-form-textarea"
              rows={3}
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              placeholder="카드에 노출될 짧은 설명"
            />
          </label>

          <label className="modal-label">
            표시 순서
            <input
              className="modal-input"
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) || 0 }))}
            />
          </label>

          <label className="admin-checkbox poll-form-checkbox">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
            />
            공개
          </label>

          <div>
            <span className="image-upload-label">상세 내용</span>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm((p) => ({ ...p, content }))}
              imageFolder="about"
              variant="article"
              minHeight={220}
              onUploadError={onUploadError}
            />
          </div>

          <div className="admin-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              취소
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
