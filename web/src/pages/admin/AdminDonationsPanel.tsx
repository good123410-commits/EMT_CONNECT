import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteDonationAccount,
  adminListDonationAccounts,
  adminUpsertDonationAccount,
  type UpsertDonationInput,
} from '../../services/donationService';
import type { DonationAccount } from '../../types';

const EMPTY_FORM: UpsertDonationInput = {
  bank_name: '',
  account_number: '',
  account_holder: '',
  purpose: '',
  display_order: 0,
  is_active: true,
};

export function AdminDonationsPanel() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertDonationInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const rows = await adminListDonationAccounts();
      setAccounts(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const startEdit = (account: DonationAccount) => {
    setEditingId(account.id);
    setForm({
      id: account.id,
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder: account.account_holder,
      purpose: account.purpose,
      display_order: account.display_order,
      is_active: account.is_active,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.bank_name || !form.account_number || !form.account_holder) {
      setError('은행명, 계좌번호, 예금주는 필수입니다.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminUpsertDonationAccount(form);
      showToast(editingId ? '계좌가 수정되었습니다.' : '계좌가 추가되었습니다.');
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 계좌를 삭제하시겠습니까?')) return;
    try {
      await adminDeleteDonationAccount(id);
      showToast('계좌가 삭제되었습니다.');
      if (editingId === id) resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (account: DonationAccount) => {
    try {
      await adminUpsertDonationAccount({
        id: account.id,
        bank_name: account.bank_name,
        account_number: account.account_number,
        account_holder: account.account_holder,
        purpose: account.purpose,
        display_order: account.display_order,
        is_active: !account.is_active,
      });
      await reload();
      showToast(account.is_active ? '계좌가 비활성화되었습니다.' : '계좌가 활성화되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    }
  };

  return (
    <section className="admin-panel">
      <h2>모금 계좌 관리</h2>
      <p className="muted">변경 사항은 모금 계좌 안내 페이지에 실시간 반영됩니다.</p>

      {error ? <p className="error">{error}</p> : null}

      <div className="admin-form-card">
        <h3>{editingId ? '계좌 수정' : '새 계좌 추가'}</h3>
        <div className="admin-form-grid">
          <label>
            은행명
            <input
              className="modal-input"
              value={form.bank_name}
              onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
            />
          </label>
          <label>
            계좌번호
            <input
              className="modal-input"
              value={form.account_number}
              onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
            />
          </label>
          <label>
            예금주
            <input
              className="modal-input"
              value={form.account_holder}
              onChange={(e) => setForm((f) => ({ ...f, account_holder: e.target.value }))}
            />
          </label>
          <label>
            모금 목적
            <input
              className="modal-input"
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
            />
          </label>
          <label>
            표시 순서
            <input
              className="modal-input"
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            활성화 (공개)
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : editingId ? '수정 저장' : '추가'}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              취소
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>은행</th>
              <th>계좌번호</th>
              <th>예금주</th>
              <th>목적</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className={!a.is_active ? 'admin-row--inactive' : ''}>
                <td>{a.bank_name}</td>
                <td>{a.account_number}</td>
                <td>{a.account_holder}</td>
                <td>{a.purpose}</td>
                <td>
                  <button
                    type="button"
                    className={`admin-badge${a.is_active ? ' admin-badge--active' : ''}`}
                    onClick={() => void handleToggleActive(a)}
                  >
                    {a.is_active ? '활성' : '비활성'}
                  </button>
                </td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(a)}>
                    수정
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(a.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
