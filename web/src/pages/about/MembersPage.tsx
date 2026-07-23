import { AboutSubNav } from '../../components/AboutSubNav';
import { MemberCard } from '../../components/MemberCard';
import { PageHero } from '../../components/PageHero';
import { usePublicMembers } from '../../hooks/usePublicMembers';

export function MembersPage() {
  const { regularMembers, associateMembers, loading, error } = usePublicMembers();

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX About"
        title="회원 목록"
        subtitle="KEMIX와 함께 응급의료 혁신을 만들어가는 정회원·준회원을 소개합니다"
        dark
      />
      <AboutSubNav />

      <p className="lead members-intro">
        관리자가 지정한 회원 등급에 따라 자동으로 분류됩니다. 등급 변경 사항은 실시간으로 반영됩니다.
      </p>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <section className="members-section" aria-labelledby="regular-members-heading">
        <div className="members-section-head">
          <h2 id="regular-members-heading" className="members-section-title">
            정회원
          </h2>
          <span className="members-section-count">{regularMembers.length}명</span>
        </div>
        {regularMembers.length > 0 ? (
          <div className="members-grid">
            {regularMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="muted members-empty">등록된 정회원이 없습니다.</p>
        )}
      </section>

      <section className="members-section" aria-labelledby="associate-members-heading">
        <div className="members-section-head">
          <h2 id="associate-members-heading" className="members-section-title">
            준회원
          </h2>
          <span className="members-section-count">{associateMembers.length}명</span>
        </div>
        {associateMembers.length > 0 ? (
          <div className="members-grid">
            {associateMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="muted members-empty">등록된 준회원이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
