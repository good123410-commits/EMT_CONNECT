import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteSkillNode,
  adminListSkillNodes,
  adminUpsertSkillNode,
  type SkillNode,
} from '../../services/adminService';
import { SKILL_LEVEL_LABELS } from '../../constants/skillTree';
import { useAdminForm } from './adminShared';

const LEVELS = ['foundation', 'intermediate', 'advanced', 'expert'] as const;

const EMPTY = {
  level: 'foundation' as SkillNode['level'],
  title: '',
  description: '',
  prerequisites: '',
  recommended_courses: '',
  display_order: 0,
  is_published: true,
};

export function AdminSkillsPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const reload = useCallback(async () => {
    try {
      setRows(await adminListSkillNodes());
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
    setSaving(true);
    try {
      await adminUpsertSkillNode({
        id: editingId ?? undefined,
        level: form.level,
        title: form.title,
        description: form.description,
        prerequisites: form.prerequisites.split(',').map((s) => s.trim()).filter(Boolean),
        recommended_courses: form.recommended_courses,
        display_order: form.display_order,
        is_published: form.is_published,
      });
      showToast(editingId ? '스킬 노드가 수정되었습니다.' : '스킬 노드가 추가되었습니다.');
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
      await adminDeleteSkillNode(id);
      showToast('삭제되었습니다.');
      if (editingId === id) reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const moveOrder = async (node: SkillNode, delta: number) => {
    try {
      await adminUpsertSkillNode({
        id: node.id,
        level: node.level,
        title: node.title,
        description: node.description,
        prerequisites: node.prerequisites,
        recommended_courses: node.recommended_courses,
        display_order: node.display_order + delta,
        is_published: node.is_published,
      });
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '순서 변경 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>스킬 테크 트리 관리</h2>

      <div className="admin-form-card">
        <h3>{editingId ? '노드 수정' : '새 스킬 노드'}</h3>
        <div className="admin-form-grid">
          <label>레벨
            <select className="modal-input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as SkillNode['level'] })}>
              {LEVELS.map((l) => <option key={l} value={l}>{SKILL_LEVEL_LABELS[l]}</option>)}
            </select>
          </label>
          <label>순서<input className="modal-input" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></label>
          <label className="admin-span-2">기술명<input className="modal-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="admin-span-2">상세 설명<textarea className="modal-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>선행 조건 (쉼표 구분)<input className="modal-input" value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} placeholder="basic-life-support, trauma-assessment" /></label>
          <label>권장 이수 과목<input className="modal-input" value={form.recommended_courses} onChange={(e) => setForm({ ...form, recommended_courses: e.target.value })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> 공개</label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>{saving ? '저장 중…' : '저장'}</button>
          {editingId ? <button type="button" className="btn btn-secondary" onClick={reset}>취소</button> : null}
        </div>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>순서</th><th>레벨</th><th>기술명</th><th>공개</th><th>관리</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void moveOrder(r, -1)}>↑</button>
                  {r.display_order}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void moveOrder(r, 1)}>↓</button>
                </td>
                <td>{SKILL_LEVEL_LABELS[r.level]}</td>
                <td>{r.title}</td>
                <td>{r.is_published ? 'Y' : 'N'}</td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(r.id, { level: r.level, title: r.title, description: r.description, prerequisites: r.prerequisites.join(', '), recommended_courses: r.recommended_courses, display_order: r.display_order, is_published: r.is_published })}>수정</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(r.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
