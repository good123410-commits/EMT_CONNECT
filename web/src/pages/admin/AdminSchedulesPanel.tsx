import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteSchedule,
  adminListSchedules,
  adminUpsertSchedule,
  type UpsertScheduleInput,
} from '../../services/adminService';
import type { KemixSchedule } from '../../types';
import { useAdminForm } from './adminShared';

const TAG_COLORS = ['#047857', '#0369a1', '#6d28d9', '#b45309', '#be123c'];

const EMPTY: UpsertScheduleInput = {
  title: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10),
  location: '',
  description: '',
  tag_color: '#047857',
  is_published: true,
  display_order: 0,
};

export function AdminSchedulesPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<KemixSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const reload = useCallback(async () => {
    try {
      setRows(await adminListSchedules());
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.start_date) {
      showToast('제목과 시작일을 입력해 주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminUpsertSchedule({
        ...form,
        end_date: form.end_date || form.start_date,
        id: editingId ?? undefined,
      });
      showToast(editingId ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.');
      reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await adminDeleteSchedule(id);
      showToast('삭제되었습니다.');
      if (editingId === id) reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>KEMIX 일정 관리</h2>
      <p className="muted">달력에 표시되려면 <strong>공개</strong>를 체크해야 합니다. 학술대회·교육·행사 일정을 등록하세요.</p>

      <div className="admin-form-card">
        <h3>{editingId ? '일정 수정' : '새 일정 등록'}</h3>
        <div className="admin-form-grid">
          <label className="admin-span-2">
            일정 제목
            <input className="modal-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            시작일
            <input className="modal-input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </label>
          <label>
            종료일
            <input className="modal-input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </label>
          <label className="admin-span-2">
            장소
            <input className="modal-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label className="admin-span-2">
            상세 설명
            <textarea className="modal-textarea" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label>
            태그 색상
            <div className="admin-color-row">
              <input className="modal-input" type="color" value={form.tag_color} onChange={(e) => setForm({ ...form, tag_color: e.target.value })} />
              <select className="modal-input" value={form.tag_color} onChange={(e) => setForm({ ...form, tag_color: e.target.value })}>
                {TAG_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label>
            순서
            <input className="modal-input" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            공개 (달력 노출)
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            저장
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={reset}>
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
              <th>제목</th>
              <th>기간</th>
              <th>장소</th>
              <th>색상</th>
              <th>공개</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>
                  {row.start_date}
                  {row.end_date !== row.start_date ? ` ~ ${row.end_date}` : ''}
                </td>
                <td>{row.location || '—'}</td>
                <td>
                  <span className="admin-color-swatch" style={{ backgroundColor: row.tag_color }} />
                </td>
                <td>{row.is_published ? 'Y' : 'N'}</td>
                <td className="admin-table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      startEdit(row.id, {
                        title: row.title,
                        start_date: row.start_date,
                        end_date: row.end_date,
                        location: row.location,
                        description: row.description,
                        tag_color: row.tag_color,
                        is_published: row.is_published,
                        display_order: row.display_order,
                      })
                    }
                  >
                    수정
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => void handleDelete(row.id)}>
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
