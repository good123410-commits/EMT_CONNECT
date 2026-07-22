import { useCallback, useEffect, useState } from 'react';
import { ImageUploadField } from '../../components/ImageUploadField';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteInterview,
  adminListInterviews,
  adminUpsertInterview,
  type UpsertInterviewInput,
} from '../../services/adminService';
import type { MonthlyInterview } from '../../types';
import { extractFirstImageUrl } from '../../utils/htmlContent';
import { useAdminForm } from './adminShared';

const EMPTY: UpsertInterviewInput = {
  title: '',
  interviewee_name: '',
  interviewee_role: '',
  excerpt: '',
  content: '',
  thumbnail_url: '',
  published_month: new Date().toISOString().slice(0, 7),
  is_published: false,
  is_featured: false,
};

export function AdminInterviewsPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<MonthlyInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailManual, setThumbnailManual] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const reload = useCallback(async () => {
    try {
      setRows(await adminListInterviews());
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleReset = () => {
    reset();
    setThumbnailManual(false);
  };

  const handleStartEdit = (id: string, values: UpsertInterviewInput) => {
    startEdit(id, values);
    setThumbnailManual(!!values.thumbnail_url?.trim());
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.interviewee_name.trim()) {
      showToast('타이틀과 인터뷰이 이름을 입력해 주세요.', 'error');
      return;
    }

    const autoThumb = extractFirstImageUrl(form.content);
    const thumbnail_url =
      thumbnailManual && form.thumbnail_url?.trim()
        ? form.thumbnail_url.trim()
        : form.thumbnail_url?.trim() || autoThumb || '';

    setSaving(true);
    try {
      await adminUpsertInterview({ ...form, thumbnail_url, id: editingId ?? undefined });
      showToast(editingId ? '인터뷰가 수정되었습니다.' : '인터뷰가 등록되었습니다.');
      handleReset();
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
      await adminDeleteInterview(id);
      showToast('삭제되었습니다.');
      if (editingId === id) handleReset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const previewThumb = form.thumbnail_url?.trim() || extractFirstImageUrl(form.content);

  return (
    <section className="admin-panel">
      <h2>이달의 인터뷰 관리</h2>
      <p className="muted">대표 인터뷰는 메인 화면 Monthly Interview 섹션에 노출됩니다.</p>

      <div className="admin-form-card">
        <h3>{editingId ? '인터뷰 수정' : '새 인터뷰 등록'}</h3>
        <div className="admin-form-grid">
          <label>
            년월 (YYYY-MM)
            <input
              className="modal-input"
              value={form.published_month}
              onChange={(e) => setForm({ ...form, published_month: e.target.value })}
            />
          </label>
          <label>
            인터뷰이 이름
            <input
              className="modal-input"
              value={form.interviewee_name}
              onChange={(e) => setForm({ ...form, interviewee_name: e.target.value })}
            />
          </label>
          <label>
            소속
            <input
              className="modal-input"
              value={form.interviewee_role ?? ''}
              onChange={(e) => setForm({ ...form, interviewee_role: e.target.value })}
            />
          </label>
          <label>
            타이틀
            <input className="modal-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="admin-span-2">
            요약문 (리드)
            <input className="modal-input" value={form.excerpt ?? ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </label>
          <div className="admin-span-2">
            <ImageUploadField
              label="대표 썸네일 (선택)"
              hint="미지정 시 본문 첫 번째 이미지가 자동으로 썸네일이 됩니다"
              folder="interviews"
              value={form.thumbnail_url ?? ''}
              onChange={(url) => {
                setThumbnailManual(!!url);
                setForm({ ...form, thumbnail_url: url });
              }}
              onError={(msg) => showToast(msg, 'error')}
            />
            {!thumbnailManual && previewThumb ? (
              <p className="admin-field-tip admin-field-tip--success">
                자동 썸네일 미리보기: 본문 첫 이미지가 대표 썸네일로 사용됩니다.
              </p>
            ) : null}
            {thumbnailManual ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setThumbnailManual(false);
                  setForm({ ...form, thumbnail_url: '' });
                }}
              >
                수동 썸네일 해제 (본문 첫 이미지 사용)
              </button>
            ) : null}
          </div>
          <div className="admin-span-2">
            <span className="image-upload-label">인터뷰 본문</span>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="인터뷰 본문을 작성하세요. 이미지는 툴바에서 첨부할 수 있습니다."
              imageFolder="interviews"
              variant="article"
              minHeight={320}
              onUploadError={(msg) => showToast(msg, 'error')}
            />
          </div>
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />{' '}
            공개
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />{' '}
            대표 인터뷰 (메인 노출)
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : editingId ? '수정 저장' : '등록'}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
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
              <th>년월</th>
              <th>타이틀</th>
              <th>인터뷰이</th>
              <th>대표</th>
              <th>공개</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.published_month}</td>
                <td>{r.title}</td>
                <td>{r.interviewee_name}</td>
                <td>{r.is_featured ? '★' : '-'}</td>
                <td>{r.is_published ? 'Y' : 'N'}</td>
                <td className="admin-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      handleStartEdit(r.id, {
                        title: r.title,
                        interviewee_name: r.interviewee_name,
                        interviewee_role: r.interviewee_role ?? '',
                        excerpt: r.excerpt ?? '',
                        content: r.content,
                        thumbnail_url: r.thumbnail_url ?? '',
                        published_month: r.published_month,
                        is_published: r.is_published,
                        is_featured: r.is_featured ?? false,
                      })
                    }
                  >
                    수정
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(r.id)}>
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
