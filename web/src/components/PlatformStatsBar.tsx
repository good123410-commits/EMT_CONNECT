import { useCountUp } from '../hooks/useCountUp';
import { usePlatformStats } from '../hooks/usePlatformStats';
import { formatStatNumber } from '../services/guideService';

function AnimatedStatItem({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading?: boolean;
}) {
  const animated = useCountUp(value, { enabled: !loading });

  return (
    <div className="stats-item">
      <div className={`stats-value ${loading ? 'stats-value--loading' : ''}`}>
        {loading ? '—' : formatStatNumber(animated)}
      </div>
      <div className="stats-label">{label}</div>
    </div>
  );
}

export function PlatformStatsBar() {
  const { stats, loading } = usePlatformStats();

  return (
    <section className="stats-bar stats-bar--four" aria-label="플랫폼 실시간 통계">
      <AnimatedStatItem label="앱 누적 다운로드" value={stats.download_count} loading={loading} />
      <div className="stats-divider" aria-hidden />
      <AnimatedStatItem label="등록된 응급처치 가이드" value={stats.guide_count} loading={loading} />
      <div className="stats-divider" aria-hidden />
      <AnimatedStatItem label="총 회원수" value={stats.member_count} loading={loading} />
      <div className="stats-divider" aria-hidden />
      <AnimatedStatItem label="금일 방문자 수" value={stats.today_visitor_count} loading={loading} />
    </section>
  );
}
