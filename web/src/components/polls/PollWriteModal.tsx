import { useEffect, useState } from 'react';
import type { Poll, PollOption } from '../../types';

export type PollFormState = {
  title: string;
  description: string;
  is_published: boolean;
  ends_at: string;
  display_order: number;
  options: Array<{ id?: string; label: string }>;
};

export const EMPTY_POLL_FORM: PollFormState = {
  title: '',
  description: '',
  is_published: true,
  ends_at: '',
  display_order: 0,
  options: [{ label: '' }, { label: '' }],
};

export function pollToForm(poll: Poll): PollFormState {
  return {
    title: poll.title,
    description: poll.description,
    is_published: poll.is_published,
    ends_at: poll.ends_at ? poll.ends_at.slice(0, 16) : '',
    display_order: poll.display_order,
    options:
      poll.options.length > 0
        ? poll.options
            .slice()
            .sort((a, b) => a.display_order - b.display_order)
            .map((opt) => ({ id: opt.id, label: opt.label }))
        : [{ label: '' }, { label: '' }],
  };
}

export function PollWriteModal({
  open,
  initial,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: PollFormState;
  saving: boolean;
  onClose: () => void;
  onSave: (form: PollFormState) => void;
}) {
  const [form, setForm] = useState<PollFormState>(initial);

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

  const updateOption = (index: number, label: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, label } : opt)),
    }));
  };

  const addOption = () => {
    setForm((prev) => ({ ...prev, options: [...prev.options, { label: '' }] }));
  };

  const removeOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

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

        <h2 className="modal-title">투표 안건 {initial.title ? '수정' : '작성'}</h2>
        <p className="modal-desc">제목, 설명, 투표 항목, 종료일을 설정하세요.</p>

        <div className="poll-form">
          <label className="modal-label">
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="투표 제목"
            />
          </label>

          <label className="modal-label">
            설명
            <textarea
              className="modal-input poll-form-textarea"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="투표에 대한 설명"
              rows={4}
            />
          </label>

          <label className="modal-label">
            종료일 (선택)
            <input
              className="modal-input"
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
            />
          </label>

          <label className="admin-checkbox poll-form-checkbox">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
            />
            공개 (체크 해제 시 비공개)
          </label>

          <div className="poll-form-options">
            <div className="poll-form-options-head">
              <span className="modal-label">투표 항목</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>
                + 항목 추가
              </button>
            </div>
            {form.options.map((opt, index) => (
              <div key={opt.id ?? `new-${index}`} className="poll-form-option-row">
                <input
                  className="modal-input"
                  value={opt.label}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`항목 ${index + 1}`}
                />
                {form.options.length > 2 ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeOption(index)}
                    aria-label="항목 삭제"
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="admin-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              취소
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function getVotePercent(option: PollOption, total: number): number {
  if (total <= 0) return 0;
  return Math.round(((option.vote_count ?? 0) / total) * 100);
}
