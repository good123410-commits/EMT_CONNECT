import { useCallback, useEffect, useState } from 'react';
import { ADMIN_ROLE_OPTIONS, getRoleLabel, LEGACY_ROLE_OPTIONS, MEMBERSHIP_ROLES } from '../../constants/roles';
import { useToast } from '../../contexts/ToastContext';
import { adminListUsers, adminSetUserBlocked, adminSetUserRole } from '../../services/adminService';
import type { AdminUserRow, UserRole } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function AdminUsersPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminListUsers({ search, limit: 200 }));
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

  return (
    <section className="admin-panel">
      <h2>유저 관리</h2>
      <p className="muted">
        가입 유저의 등급(정회원 · 준회원 · 일반회원) 및 관리자 권한을 설정합니다. 변경 사항은 회원 목록에
        실시간 반영됩니다.
      </p>

      <div className="admin-form-card admin-form-card--compact">
        <label className="admin-span-full">
          검색 (이메일 · 이름)
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
        <p className="muted">검색 결과가 없습니다.</p>
      ) : null}
    </section>
  );
}
