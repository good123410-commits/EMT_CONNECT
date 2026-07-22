import { useEffect, useId, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  adminDeletePostCategory,
  adminListPostCategories,
  adminUpsertPostCategory,
  slugify,
  type PostCategory,
} from '../services/adminService';

type GuideCategoryManageModalProps = {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

const EMPTY = { name: '', slug: '', display_order: 0, is_active: true };

export function GuideCategoryManageModal({ open, onClose, onChanged }: GuideCategoryManageModalProps) {
  const titleId = useId();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const reload = async () => {
    setLoading(true);
    try {
      setCategories(await adminListPostCategories());
    } catch (err) {
      showToast(err instanceof Error ? err.message : '카테고리 불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    void reload();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleAdd = async () => {
    if (!form.name.trim()) {
      showToast('카테고리 이름을 입력해 주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug.trim() || slugify(form.name);
      await adminUpsertPostCategory({
        name: form.name,
        slug,
        display_order: form.display_order,
        is_active: form.is_active,
      });
      showToast('카테고리가 추가되었습니다.');
      setForm(EMPTY);
      await reload();
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '추가 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return;
    try {
      await adminDeletePostCategory(id);
      showToast('카테고리가 삭제되었습니다.');
      await reload();
      onChanged();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2 id={titleId} className="modal-title">
          가이드 카테고리 관리
        </h2>
        <p className="modal-desc">카테고리를 추가하거나 삭제하면 가이드 등록 폼에 즉시 반영됩니다.</p>

        <div className="admin-form-grid admin-form-grid--compact">
          <label>
            카테고리 이름
            <input
              className="modal-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
            />
          </label>
          <label>
            슬러그
            <input
              className="modal-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
          <label>
            정렬 순서
            <input
              className="modal-input"
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
            />
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleAdd()}>
            {saving ? '추가 중…' : '카테고리 추가'}
          </button>
        </div>

        {loading ? <p className="muted">불러오는 중…</p> : null}
        <div className="admin-table-wrap admin-table-wrap--compact">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>슬러그</th>
                <th>순서</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td>{cat.display_order}</td>
                  <td className="admin-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => void handleDelete(cat.id, cat.name)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
