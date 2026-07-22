import { useEffect, useId, useState } from 'react';
import type { KemixInquiry } from '../types';

type InquiryAnswerModalProps = {
  inquiry: KemixInquiry | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (answer: string) => void;
};

export function InquiryAnswerModal({ inquiry, open, saving, onClose, onSave }: InquiryAnswerModalProps) {
  const titleId = useId();
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (!open || !inquiry) return;
    setAnswer(inquiry.admin_answer ?? '');

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, inquiry, onClose]);

  if (!open || !inquiry) return null;

  const isEdit = inquiry.status === 'answered';

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-dialog modal-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 id={titleId} className="modal-title">
          {isEdit ? '답변 수정' : '답변 작성'}
        </h2>

        <div className="inquiry-answer-preview">
          <p className="inquiry-answer-preview-label">문의 제목</p>
          <p className="inquiry-answer-preview-title">{inquiry.title}</p>
          <p className="inquiry-answer-preview-label">문의 내용</p>
          <p className="inquiry-answer-preview-content">{inquiry.content}</p>
        </div>

        <label className="modal-label" htmlFor="inquiry-admin-answer">
          관리자 답변
        </label>
        <textarea
          id="inquiry-admin-answer"
          className="modal-textarea"
          rows={6}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={saving}
          placeholder="답변 내용을 입력해 주세요."
        />

        <div className="admin-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || !answer.trim()}
            onClick={() => onSave(answer)}
          >
            {saving ? '저장 중…' : isEdit ? '답변 수정' : '답변 저장'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
