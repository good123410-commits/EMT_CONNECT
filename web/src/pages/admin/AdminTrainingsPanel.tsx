import { useCallback, useEffect, useState } from 'react';
import { FileUploadField } from '../../components/FileUploadField';
import { RichTextEditor } from '../../components/RichTextEditor';
import { TrainingCategoryManageModal } from '../../components/TrainingCategoryManageModal';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteTraining,
  adminListTrainingCategories,
  adminListTrainings,
  adminUpsertTraining,
  adminUpsertTrainingCategory,
  slugify,
  type TrainingCategory,
  type UpsertTrainingInput,
} from '../../services/adminService';
import { getTrainingCategoryLabel } from '../../services/trainingService';
import type { KemixTraining } from '../../types';
import { normalizeDateString } from '../../utils/dateUtils';
import { useAdminForm } from './adminShared';

const EMPTY: UpsertTrainingInput = {
  title: '',
  category: 'general',
  training_start: '',
  training_end: '',
  status: 'recruiting',
  apply_url: '',
  attachment_url: '',
  excerpt: '',
  content: '',
  is_published: true,
  display_order: 0,
};

export function AdminTrainingsPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<KemixTraining[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const categoryOptions =
    categories.length > 0
      ? categories.filter((c) => c.is_active)
      : [{ id: 'fb-general', name: '기타', slug: 'general', display_order: 0, is_active: true }];

  const reload = useCallback(async () => {
    try {
      const [trainings, cats] = await Promise.all([adminListTrainings(), adminListTrainingCategories()]);
      setRows(trainings);
      setCategories(cats);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      showToast('카테고리 이름을 입력해 주세요.', 'error');
      return;
    }
    setAddingCategory(true);
    try {
      const slug = slugify(name);
      const created = await adminUpsertTrainingCategory({
        name,
        slug,
        display_order: categories.length,
        is_active: true,
      });
      showToast(`"${name}" 카테고리가 추가되었습니다.`);
      setNewCategoryName('');
      await reload();
      setForm((prev) => ({ ...prev, category: created.slug }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : '카테고리 추가 실패', 'error');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast('교육 제목을 입력해 주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminUpsertTraining({
        ...form,
        training_start: form.training_start?.trim() ? form.training_start : null,
        training_end: form.training_end?.trim() ? form.training_end : null,
        apply_url: form.apply_url?.trim() ? form.apply_url.trim() : null,
        attachment_url: form.attachment_url?.trim() ? form.attachment_url.trim() : null,
        id: editingId ?? undefined,
      });
      showToast(editingId ? '교육 안내가 수정되었습니다.' : '교육 안내가 등록되었습니다.');
      reset();
      setForm(EMPTY);
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
      await adminDeleteTraining(id);
      showToast('삭제되었습니다.');
      if (editingId === id) {
        reset();
        setForm(EMPTY);
      }
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2>KEMIX 교육 관리</h2>
          <p className="muted">교육 과정 모집 공고 및 안내글을 등록합니다. 공개 체크 시 사용자 게시판에 노출됩니다.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setCategoryModalOpen(true)}>
          카테고리 전체 관리
        </button>
      </div>

      <div className="admin-form-card">
        <h3>{editingId ? '교육 안내 수정' : '새 교육 안내 등록'}</h3>
        <div className="admin-form-grid">
          <label className="admin-span-2">
            교육 과정명
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>

          <div className="admin-category-field">
            <span className="image-upload-label">카테고리</span>
            <div className="admin-category-row">
              <select
                className="modal-input"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-category-add">
              <input
                className="modal-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="새 카테고리 이름"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddCategory();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={addingCategory}
                onClick={() => void handleAddCategory()}
              >
                {addingCategory ? '추가 중…' : '+ 카테고리 추가'}
              </button>
            </div>
          </div>

          <label>
            신청 상태
            <select
              className="modal-input"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value as UpsertTrainingInput['status'] }))
              }
            >
              <option value="recruiting">모집중</option>
              <option value="closed">마감</option>
              <option value="upcoming">예정</option>
            </select>
          </label>
          <label>
            교육 시작일
            <input
              className="modal-input"
              type="date"
              value={form.training_start ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, training_start: e.target.value }))}
            />
          </label>
          <label>
            교육 종료일
            <input
              className="modal-input"
              type="date"
              value={form.training_end ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, training_end: e.target.value }))}
            />
          </label>
          <label className="admin-span-2">
            신청 링크
            <input
              className="modal-input"
              value={form.apply_url ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, apply_url: e.target.value }))}
              placeholder="https://"
            />
          </label>

          <div className="admin-span-2">
            <FileUploadField
              label="첨부파일"
              folder="trainings/attachments"
              value={form.attachment_url ?? ''}
              onChange={(url) => setForm((prev) => ({ ...prev, attachment_url: url }))}
              onError={(msg) => showToast(msg, 'error')}
            />
          </div>

          <label className="admin-span-2">
            요약
            <textarea
              className="modal-textarea"
              rows={2}
              value={form.excerpt ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            />
          </label>
          <label>
            순서
            <input
              className="modal-input"
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((prev) => ({ ...prev, display_order: Number(e.target.value) }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
            />
            공개 (사용자 게시판 노출)
          </label>
        </div>

        <div className="admin-span-2">
          <span className="image-upload-label">본문 (리치 텍스트)</span>
          <RichTextEditor
            value={form.content}
            onChange={(content) => setForm((prev) => ({ ...prev, content }))}
            placeholder="교육 안내 본문을 작성하세요."
            imageFolder="trainings"
            variant="article"
            minHeight={280}
            onUploadError={(msg) => showToast(msg, 'error')}
          />
        </div>

        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : editingId ? '수정 저장' : '등록'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                reset();
                setForm(EMPTY);
              }}
            >
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
              <th>카테고리</th>
              <th>상태</th>
              <th>공개</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{getTrainingCategoryLabel(row.category, categories)}</td>
                <td>{row.status}</td>
                <td>{row.is_published ? 'Y' : 'N'}</td>
                <td className="admin-table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      startEdit(row.id, {
                        title: row.title,
                        category: row.category,
                        training_start: row.training_start ? normalizeDateString(row.training_start) : '',
                        training_end: row.training_end ? normalizeDateString(row.training_end) : '',
                        status: row.status,
                        apply_url: row.apply_url ?? '',
                        attachment_url: row.attachment_url ?? '',
                        excerpt: row.excerpt ?? '',
                        content: row.content,
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

      <TrainingCategoryManageModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onChanged={() => void reload()}
      />
    </section>
  );
}
