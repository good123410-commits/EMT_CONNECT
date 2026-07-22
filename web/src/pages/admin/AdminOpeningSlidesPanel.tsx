import { useCallback, useEffect, useState } from 'react';
import { ImageUploadField } from '../../components/ImageUploadField';
import { useToast } from '../../contexts/ToastContext';
import { OPENING_SLIDES } from '../../constants/openingSlides';
import {
  adminDeleteOpeningSlide,
  adminListOpeningSlides,
  adminUpsertOpeningSlide,
} from '../../services/adminService';
import type { OpeningSlide } from '../../types';
import { useAdminForm } from './adminShared';

const EMPTY = {
  image_url: '',
  fallback_url: '',
  title: '',
  caption: '',
  display_order: 0,
  is_active: true,
};

export function AdminOpeningSlidesPanel() {
  const { showToast } = useToast();
  const [dbRows, setDbRows] = useState<OpeningSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const reload = useCallback(async () => {
    try {
      setDbRows(await adminListOpeningSlides());
    } catch {
      setDbRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSave = async () => {
    if (!form.image_url.trim()) {
      showToast('슬라이드 이미지 URL을 입력하거나 업로드해 주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminUpsertOpeningSlide({
        ...form,
        id: editingId ?? undefined,
        fallback_url: form.fallback_url || null,
        caption: form.caption || null,
      });
      showToast(editingId ? '슬라이드가 수정되었습니다.' : '슬라이드가 등록되었습니다.');
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
      await adminDeleteOpeningSlide(id);
      showToast('삭제되었습니다.');
      if (editingId === id) reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>오프닝 &amp; 메인 슬라이드 관리</h2>
      <p className="muted">
        Supabase DB에 등록된 슬라이드가 <strong>최우선</strong> 적용됩니다. DB가 비어 있으면{' '}
        <code>public/assets/opening/</code> 로컬 폴더 이미지가 사용됩니다.
      </p>

      <div className="admin-info-card">
        <h3>현재 로컬 Fallback 슬라이드 ({OPENING_SLIDES.length}장)</h3>
        <ul className="admin-opening-local-list">
          {OPENING_SLIDES.map((slide) => (
            <li key={slide.id}>
              <strong>{slide.title}</strong> — <code>{slide.image_url}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-form-card">
        <h3>{editingId ? '슬라이드 수정' : '새 슬라이드 등록 (DB)'}</h3>
        <div className="admin-form-grid">
          <div className="admin-span-2">
            <ImageUploadField
              label="슬라이드 이미지 (Supabase Storage)"
              folder="opening"
              value={form.image_url}
              onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
              onError={(msg) => showToast(msg, 'error')}
              hint="1920×1080 권장 · JPG/PNG/WEBP"
            />
          </div>
          <label className="admin-span-2">
            이미지 URL (직접 입력)
            <input
              className="modal-input"
              value={form.image_url}
              onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label>
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
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
          <label className="admin-span-2">
            캡션
            <input
              className="modal-input"
              value={form.caption}
              onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            활성
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : '저장'}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={reset}>
              취소
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <p className="muted">DB 슬라이드 불러오는 중…</p> : null}
      {dbRows.length === 0 && !loading ? (
        <p className="muted">등록된 DB 슬라이드가 없습니다. 로컬 폴더 fallback이 사용 중입니다.</p>
      ) : null}

      {dbRows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>미리보기</th>
                <th>제목</th>
                <th>순서</th>
                <th>활성</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {dbRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <img src={row.image_url} alt="" className="admin-thumb" />
                  </td>
                  <td>{row.title}</td>
                  <td>{row.display_order}</td>
                  <td>{row.is_active ? 'Y' : 'N'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        startEdit(row.id, {
                          image_url: row.image_url,
                          fallback_url: row.fallback_url ?? '',
                          title: row.title,
                          caption: row.caption ?? '',
                          display_order: row.display_order,
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
