import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteHomeEmergencyNotice,
  adminListHomeEmergencyNotices,
  adminUpsertHomeEmergencyNotice,
  type HomeEmergencyNoticeRow,
} from '../../services/adminService';
import { useAdminForm } from './adminShared';

const EMPTY = {
  message: '',
  sort_order: 0,
  is_active: true,
};

export function AdminEmergencyNoticesSection() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<HomeEmergencyNoticeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const reload = useCallback(async () => {
    try {
      setRows(await adminListHomeEmergencyNotices());
    } catch (err) {
      showToast(err instanceof Error ? err.message : '긴급 공지를 불러오지 못했습니다.', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openCreate = () => {
    reset();
    const nextOrder = rows.reduce((max, row) => Math.max(max, row.sort_order), -1) + 1;
    setForm({ ...EMPTY, sort_order: nextOrder });
  };

  const handleSave = async () => {
    if (!form.message.trim()) {
      showToast('긴급 공지 내용을 입력하세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminUpsertHomeEmergencyNotice({
        id: editingId ?? undefined,
        message: form.message,
        is_active: form.is_active,
        sort_order: form.sort_order,
      });
      showToast(editingId ? '긴급 공지가 수정되었습니다.' : '긴급 공지가 추가되었습니다.');
      reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 긴급 공지를 삭제하시겠습니까?')) return;
    try {
      await adminDeleteHomeEmergencyNotice(id);
      showToast('삭제되었습니다.');
      if (editingId === id) reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel admin-panel--emergency" style={{ marginBottom: '2rem' }}>
      <div className="admin-panel-head">
        <div>
          <h2>긴급 공지 (홈 전광판)</h2>
          <p className="muted">
            이벤트 배너 아래 LED 전광판에 최우선 노출됩니다. 기상특보·산불·재난문자 공공 API보다 앞에 표시됩니다.
          </p>
        </div>
        <button type="button" className="btn btn-danger" onClick={openCreate}>
          + 긴급 공지 추가
        </button>
      </div>

      <div className="admin-form-card">
        <h3>{editingId ? '긴급 공지 수정' : '새 긴급 공지'}</h3>
        <div className="admin-form-grid">
          <label className="admin-span-2">
            공지 내용
            <textarea
              className="modal-input"
              rows={2}
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="예: 서울 전역 호우주의보 발령 — 외출 자제"
            />
          </label>
          <label>
            순서
            <input
              className="modal-input"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            전광판 노출
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-danger" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : '저장'}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={reset}>
              취소
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <p className="muted">긴급 공지 불러오는 중…</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="muted">등록된 긴급 공지가 없습니다.</p>
      ) : null}

      {rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>내용</th>
                <th>순서</th>
                <th>노출</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.message}</td>
                  <td>{row.sort_order}</td>
                  <td>{row.is_active ? 'Y' : 'N'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        startEdit(row.id, {
                          message: row.message,
                          sort_order: row.sort_order,
                          is_active: row.is_active,
                        })
                      }
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => void handleDelete(row.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
