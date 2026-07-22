import { useEffect, useId, useState } from 'react';

type CommunityReportModalProps = {
  open: boolean;
  title: string;
  preview?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

const REPORT_REASONS = [
  '욕설·비방',
  '개인정보 노출',
  '허위 정보',
  '스팸·광고',
  '기타',
];

export function CommunityReportModal({
  open,
  title,
  preview,
  saving = false,
  onClose,
  onSubmit,
}: CommunityReportModalProps) {
  const titleId = useId();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setCustomReason('');

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

  const finalReason = reason === '기타' ? customReason.trim() : reason;

  return (
    <div className="modal-overlay modal-overlay--nested" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog community-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <h2 id={titleId} className="modal-title">
          🚨 {title}
        </h2>
        {preview ? <p className="community-report-preview">{preview}</p> : null}

        <p className="modal-label">신고 사유</p>
        <div className="community-report-reasons">
          {REPORT_REASONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`community-report-reason${reason === item ? ' community-report-reason--active' : ''}`}
              onClick={() => setReason(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {reason === '기타' ? (
          <textarea
            className="modal-textarea"
            rows={3}
            placeholder="신고 사유를 입력해 주세요."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            disabled={saving}
          />
        ) : null}

        <div className="admin-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || !finalReason}
            onClick={() => onSubmit(finalReason)}
          >
            {saving ? '접수 중…' : '신고 접수'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
