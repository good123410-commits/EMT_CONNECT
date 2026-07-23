import { useCallback, useEffect, useState } from 'react';
import { ADMIN_ROLE_OPTIONS, getRoleLabel, LEGACY_ROLE_OPTIONS, MEMBERSHIP_ROLES } from '../../constants/roles';
import { useToast } from '../../contexts/ToastContext';
import {
  adminListPendingVerifications,
  adminListUsers,
  adminReviewVerification,
  adminSetUserBlocked,
  adminSetUserDuesPaid,
  adminSetUserRole,
  type AdminVerificationRow,
} from '../../services/adminService';
import type { AdminUserRow, UserRole } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function AdminUsersPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<AdminVerificationRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [users, pending] = await Promise.all([
        adminListUsers({ search, limit: 200 }),
        adminListPendingVerifications(),
      ]);
      setRows(users);
      setPendingVerifications(pending);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '유저 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 250);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);
    try {
      await adminSetUserRole(userId, role);
      showToast('등급이 변경되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '등급 변경 실패', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDuesChange = async (userId: string, paid: boolean) => {
    setSavingId(userId);
    try {
      await adminSetUserDuesPaid(userId, paid);
      showToast(paid ? '회비 납부 처리되었습니다. (정회원)' : '회비 미납 처리되었습니다. (준회원)');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '회비 상태 변경 실패', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleBlock = async (row: AdminUserRow) => {
    setSavingId(row.id);
    try {
      await adminSetUserBlocked(row.id, !row.is_blocked);
      showToast(row.is_blocked ? '차단이 해제되었습니다.' : '유저를 차단했습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '상태 변경 실패', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleReviewVerification = async (
    row: AdminVerificationRow,
    status: 'approved' | 'rejected',
  ) => {
    setSavingId(row.id);
    try {
      await adminReviewVerification(
        row.id,
        status,
        status === 'approved' ? '구급대원 승인 (준회원)' : '구급대원 인증 반려',
      );
      showToast(status === 'approved' ? '준회원으로 승인되었습니다.' : '인증이 반려되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '인증 처리 실패', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="admin-panel">
      <h2>유저 관리</h2>
      <p className="muted">
        가입 유저의 등급(일반 · 준회원 · 정회원 · 관리자)과 회비 납부 상태를 관리합니다. 구급대원
        비밀코드 인증 요청은 아래에서 승인할 수 있습니다.
      </p>

      {pendingVerifications.length > 0 ? (
        <div className="admin-form-card">
          <h3>구급대원 인증 대기 ({pendingVerifications.length})</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>제출일</th>
                  <th>유저 ID</th>
                  <th>증빙</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerifications.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.updated_at)}</td>
                    <td className="admin-cell-mono">{row.user_id.slice(0, 8)}…</td>
                    <td>
                      {row.document_url && row.document_url !== 'code-only' ? (
                        <a href={row.document_url} target="_blank" rel="noopener noreferrer">
                          보기
                        </a>
                      ) : (
                        '코드 인증'
                      )}
                    </td>
                    <td className="admin-table-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={savingId === row.id}
                        onClick={() => void handleReviewVerification(row, 'approved')}
                      >
                        준회원 승인
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={savingId === row.id}
                        onClick={() => void handleReviewVerification(row, 'rejected')}
                      >
                        반려
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="admin-form-card admin-form-card--compact">
        <label className="admin-span-full">
          검색 (이메일 · 이름 · 닉네임)
          <input
            className="modal-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색어 입력"
          />
        </label>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>가입일</th>
              <th>등급</th>
              <th>회비</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.is_blocked ? 'admin-row--inactive' : ''}>
                <td>{row.email ?? '-'}</td>
                <td>{row.name ?? '-'}</td>
                <td>{formatDate(row.created_at)}</td>
                <td>
                  <select
                    className="modal-input admin-role-select"
                    value={row.role}
                    disabled={savingId === row.id}
                    onChange={(e) => void handleRoleChange(row.id, e.target.value as UserRole)}
                  >
                    <optgroup label="회원 등급">
                      {MEMBERSHIP_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="관리자">
                      {ADMIN_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="직군(레거시)">
                      {LEGACY_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </td>
                <td>
                  <label className="admin-checkbox admin-checkbox--inline">
                    <input
                      type="checkbox"
                      checked={Boolean(row.membership_dues_paid) || row.role === 'regular_member'}
                      disabled={
                        savingId === row.id ||
                        !['associate_member', 'regular_member', 'paramedic'].includes(row.role)
                      }
                      onChange={(e) => void handleDuesChange(row.id, e.target.checked)}
                    />
                    {row.membership_dues_paid || row.role === 'regular_member' ? '납부' : '미납'}
                  </label>
                </td>
                <td>
                  {row.is_blocked ? (
                    <span className="admin-badge">차단</span>
                  ) : row.is_approved ? (
                    <span className="admin-badge admin-badge--active">승인</span>
                  ) : (
                    <span className="admin-badge">대기</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={savingId === row.id}
                    onClick={() => void handleToggleBlock(row)}
                  >
                    {row.is_blocked ? '차단 해제' : '차단'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 ? (
        <p className="muted">
          {search.trim()
            ? '검색 결과가 없습니다.'
            : '등록된 유저가 없습니다. Supabase auth.users와 프로필 동기화 후 다시 확인해 주세요.'}
        </p>
      ) : null}
    </section>
  );
}
