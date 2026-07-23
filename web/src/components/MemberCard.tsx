import { getRoleLabel } from '../constants/roles';
import type { PublicMember } from '../types';

type MemberCardProps = {
  member: PublicMember;
};

function getDisplayName(member: PublicMember): string {
  return member.nickname?.trim() || member.name?.trim() || 'KEMIX 회원';
}

function formatJoinDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

export function MemberCard({ member }: MemberCardProps) {
  const displayName = getDisplayName(member);

  return (
    <article className="member-card">
      <div className="member-card-avatar" aria-hidden>
        {displayName.charAt(0)}
      </div>
      <div className="member-card-body">
        <h3 className="member-card-name">{displayName}</h3>
        {member.company_name ? (
          <p className="member-card-company">{member.company_name}</p>
        ) : null}
        <p className="member-card-meta">
          <span className="member-card-badge">{getRoleLabel(member.role)}</span>
          <span className="member-card-joined">가입 {formatJoinDate(member.created_at)}</span>
        </p>
      </div>
    </article>
  );
}
