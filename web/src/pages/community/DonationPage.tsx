import { DonationAccountCard } from '../../components/DonationAccountCard';
import { CommunitySubNav } from '../../components/CommunitySubNav';
import { PageHero } from '../../components/PageHero';
import { useDonationAccounts } from '../../hooks/useDonationAccounts';

export function DonationPage() {
  const { accounts, loading, error } = useDonationAccounts();

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX Community"
        title="모금 계좌 안내"
        subtitle="응급의료 혁신을 위한 여러분의 따뜻한 후원을 기다립니다"
        dark
      />
      <CommunitySubNav />
      <p className="lead donation-intro">
        KEMIX는 응급구조사 교육·장비 지원 등 공익 목적으로 모금을 운영합니다. 아래 계좌로
        후원해 주시면 응급의료 현장 혁신에 소중히 사용됩니다.
      </p>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="donation-grid">
        {accounts.map((account) => (
          <DonationAccountCard key={account.id} account={account} />
        ))}
      </div>

      {!loading && accounts.length === 0 ? (
        <p className="muted">현재 안내 가능한 모금 계좌가 없습니다.</p>
      ) : null}
    </div>
  );
}
