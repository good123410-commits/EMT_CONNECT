import { useCallback, useEffect, useRef, useState } from 'react';
import { RESOURCE_CATEGORIES } from '../../constants/resourceCategories';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteResource,
  adminListResources,
  adminUpsertResource,
  formatFileSize,
  type UpsertResourceInput,
} from '../../services/resourceService';
import { uploadAttachmentFile } from '../../services/storageService';
import type { KemixResource } from '../../types';

const EMPTY_FORM: UpsertResourceInput = {
  title: '',
  description: '',
  category: 'general',
  file_url: '',
  file_name: '',
  file_size: null,
  display_order: 0,
  is_published: true,
};

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split('/').pop();
    return name && name.length > 0 ? decodeURIComponent(name) : 'resource-file';
  } catch {
    return 'resource-file';
  }
}

export function AdminResourcesPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<KemixResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertResourceInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      setRows(await adminListResources());
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

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (row: KemixResource) => {
    setEditingId(row.id);
    setForm({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      file_url: row.file_url,
      file_name: row.file_name,
      file_size: row.file_size,
      display_order: row.display_order,
      is_published: row.is_published,
    });
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAttachmentFile(file, 'resources');
      setForm((f) => ({
        ...f,
        file_url: url,
        file_name: file.name,
        file_size: file.size,
      }));
      showToast('파일이 업로드되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const fileUrl = form.file_url.trim();
    const fileName = form.file_name.trim() || (fileUrl ? fileNameFromUrl(fileUrl) : '');

    if (!title) {
      const message = '제목을 입력해 주세요.';
      setError(message);
      showToast(message, 'error');
      return;
    }
    if (!fileUrl || !fileName) {
      const message = '파일을 업로드하거나 파일 URL을 입력해 주세요.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await adminUpsertResource({
        ...form,
        title,
        description: form.description.trim(),
        file_url: fileUrl,
        file_name: fileName,
        display_order: Number.isFinite(form.display_order) ? form.display_order : 0,
      });
      showToast(editingId ? '자료가 수정되었습니다.' : '자료가 등록되었습니다.');
      resetForm();
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 자료를 삭제하시겠습니까?')) return;
    try {
      await adminDeleteResource(id);
      showToast('자료가 삭제되었습니다.');
      if (editingId === id) resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  return (
    <section className="admin-panel">
      <h2>자료실 관리</h2>
      <p className="muted">자료실 페이지에 노출되는 문서를 업로드·관리합니다.</p>

      {error ? <p className="error">{error}</p> : null}

      <div className="admin-form-card">
        <h3>{editingId ? '자료 수정' : '새 자료 등록'}</h3>
        <div className="admin-form-grid">
          <label className="admin-span-full">
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="admin-span-full">
            설명
            <textarea
              className="modal-input admin-textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label>
            분류
            <select
              className="modal-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {RESOURCE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
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
          <label className="admin-span-full">
            파일 첨부
            <input
              ref={fileInputRef}
              type="file"
              className="modal-input"
              onChange={(e) => void handleFileSelect(e.target.files?.[0] ?? null)}
              disabled={uploading}
            />
            {form.file_name ? (
              <span className="muted admin-file-meta">
                {form.file_name} ({formatFileSize(form.file_size)})
              </span>
            ) : (
              <span className="muted admin-file-meta">PDF, Word, Excel 등 문서 파일을 선택하세요.</span>
            )}
          </label>
          <label className="admin-span-full">
            파일 URL (직접 입력)
            <input
              className="modal-input"
              value={form.file_url}
              placeholder="https://..."
              onChange={(e) => {
                const nextUrl = e.target.value;
                setForm((f) => ({
                  ...f,
                  file_url: nextUrl,
                  file_name:
                    f.file_name.trim() || (nextUrl.trim() ? fileNameFromUrl(nextUrl.trim()) : ''),
                }));
              }}
            />
          </label>
          <label className="admin-span-full">
            파일명 (표시용)
            <input
              className="modal-input"
              value={form.file_name}
              placeholder="예: 응급처치_매뉴얼.pdf"
              onChange={(e) => setForm((f) => ({ ...f, file_name: e.target.value }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
            />
            공개
          </label>
        </div>
        <div className="admin-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || uploading}
            onClick={() => void handleSave()}
          >
            {saving ? '저장 중…' : editingId ? '수정 저장' : '등록'}
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
              <th>제목</th>
              <th>분류</th>
              <th>파일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={!row.is_published ? 'admin-row--inactive' : ''}>
                <td>{row.title}</td>
                <td>{row.category}</td>
                <td>{row.file_name}</td>
                <td>{row.is_published ? '공개' : '비공개'}</td>
                <td className="admin-table-actions">
                  <button type="button" className="btn btn-sm" onClick={() => startEdit(row)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
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
    </section>
  );
}
