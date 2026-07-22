import { usePlatformStats } from '../hooks/usePlatformStats';

function StatItem({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="stats-item">
      <div className={`stats-value ${loading ? 'stats-value--loading' : ''}`}>{value}</div>
      <div className="stats-label">{label}</div>
    </div>
  );
}

export function PlatformStatsBar() {
  const { stats, loading, formatStatNumber } = usePlatformStats();

  return (
    <section className="stats-bar" aria-label="플랫폼 실시간 통계">
      <StatItem
        label="앱 누적 다운로드"
        value={loading ? '—' : formatStatNumber(stats.download_count)}
        loading={loading}
      />
      <div className="stats-divider" aria-hidden />
      <StatItem
        label="등록된 응급처치 가이드"
        value={loading ? '—' : formatStatNumber(stats.guide_count)}
        loading={loading}
      />
      <div className="stats-divider" aria-hidden />
      <StatItem
        label="KEMIX 커뮤니티"
        value={loading ? '—' : formatStatNumber(stats.community_count)}
        loading={loading}
      />
    </section>
  );
}
