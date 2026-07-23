import type { FundUsageReport } from '../types';

type FundUsageDetailModalProps = {
  report: FundUsageReport | null;
  open: boolean;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatAmount(amount: number | null) {
  if (amount == null) return null;
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function FundUsageDetailModal({ report, open, onClose }: FundUsageDetailModalProps) {
  if (!open || !report) return null;

  const amountLabel = formatAmount(report.amount_used);

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card fund-usage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fund-usage-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <header className="fund-usage-modal-header">
          <p className="fund-usage-modal-date">{formatDate(report.created_at)}</p>
          <h2 id="fund-usage-modal-title" className="fund-usage-modal-title">
            {report.title}
          </h2>
          {amountLabel ? <p className="fund-usage-modal-amount">사용 금액 {amountLabel}</p> : null}
        </header>

        <div
          className="prose-block rich-content fund-usage-modal-body"
          dangerouslySetInnerHTML={{ __html: report.content }}
        />

        {report.receipt_image_url ? (
          <figure className="fund-usage-modal-receipt">
            <figcaption>영수증 · 증빙 자료</figcaption>
            <a href={report.receipt_image_url} target="_blank" rel="noopener noreferrer">
              <img src={report.receipt_image_url} alt="기금 사용 영수증" />
            </a>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
