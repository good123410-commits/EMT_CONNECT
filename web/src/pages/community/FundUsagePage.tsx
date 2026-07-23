import { useState } from 'react';
import { CommunitySubNav } from '../../components/CommunitySubNav';
import { FundUsageDetailModal } from '../../components/FundUsageDetailModal';
import { PageHero } from '../../components/PageHero';
import { useFundUsageReports } from '../../hooks/useFundUsageReports';
import type { FundUsageReport } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

function formatAmount(amount: number | null) {
  if (amount == null) return '—';
  return `${amount.toLocaleString('ko-KR')}원`;
}

function getSummary(report: FundUsageReport): string {
  if (report.summary?.trim()) return report.summary.trim();
  const plain = report.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return '상세 내용을 확인해 주세요.';
  return plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;
}

export function FundUsagePage() {
  const { reports, loading, error } = useFundUsageReports();
  const [selected, setSelected] = useState<FundUsageReport | null>(null);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX Community"
        title="기금 사용 안내"
        subtitle="모금된 기금이 어떻게 사용되었는지 투명하게 공개합니다"
        dark
      />
      <CommunitySubNav />

      <p className="lead fund-usage-intro">
        KEMIX는 후원 기금의 사용 내역을 정기적으로 공개합니다. 아래 목록에서 상세 내역과 증빙 자료를
        확인할 수 있습니다.
      </p>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="fund-usage-list" role="list" aria-label="기금 사용 내역">
        <div className="fund-usage-list-head" aria-hidden="true">
          <span className="fund-usage-col fund-usage-col--date">날짜</span>
          <span className="fund-usage-col fund-usage-col--title">제목</span>
          <span className="fund-usage-col fund-usage-col--amount">사용 금액</span>
          <span className="fund-usage-col fund-usage-col--summary">요약</span>
        </div>

        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            className="fund-usage-row"
            role="listitem"
            onClick={() => setSelected(report)}
          >
            <span className="fund-usage-col fund-usage-col--date">{formatDate(report.created_at)}</span>
            <span className="fund-usage-col fund-usage-col--title">{report.title}</span>
            <span className="fund-usage-col fund-usage-col--amount">{formatAmount(report.amount_used)}</span>
            <span className="fund-usage-col fund-usage-col--summary">{getSummary(report)}</span>
          </button>
        ))}
      </div>

      {!loading && reports.length === 0 ? (
        <p className="muted">등록된 기금 사용 내역이 없습니다.</p>
      ) : null}

      <FundUsageDetailModal
        report={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
