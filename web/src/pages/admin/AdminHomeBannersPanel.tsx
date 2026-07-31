import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageUploadField } from '../../components/ImageUploadField';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteHomeEventBanner,
  adminListHomeEventBanners,
  adminUpsertHomeEventBanner,
} from '../../services/adminService';
import type { HomeEventBanner } from '../../types';
import { useAdminForm } from './adminShared';

const EMPTY = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  sort_order: 0,
  is_active: true,
};

export function AdminHomeBannersPanel() {
  const { showToast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<HomeEventBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const reload = useCallback(async () => {
    try {
      setRows(await adminListHomeEventBanners());
    } catch (err) {
      showToast(err instanceof Error ? err.message : '배너 목록을 불러오지 못했습니다.', 'error');
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
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpsertHomeEventBanner({
        id: editingId ?? undefined,
        title: form.title,
        description: form.description,
        image_url: form.image_url || null,
        link_url: form.link_url,
        is_active: form.is_active,
        sort_order: form.sort_order,
      });
      showToast(editingId ? '배너가 수정되었습니다.' : '배너가 추가되었습니다.');
      reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 배너를 삭제하시겠습니까?')) return;
    try {
      await adminDeleteHomeEventBanner(id);
      showToast('삭제되었습니다.');
      if (editingId === id) reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2>앱 홈 이벤트 배너</h2>
          <p className="muted">
            게시글처럼 무제한 추가·수정·삭제. 저장 즉시 모바일 앱 홈 상단 슬라이드에 반영됩니다.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + 배너 추가
        </button>
      </div>

      <div ref={formRef} className="admin-form-card">
        <h3>{editingId ? '배너 수정' : '새 배너 등록'}</h3>
        <div className="admin-form-grid">
          <label>
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="이벤트 제목"
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
          <label className="admin-span-2">
            설명
            <textarea
              className="modal-input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="한 줄 설명"
            />
          </label>
          <label className="admin-span-2">
            링크 URL
            <input
              className="modal-input"
              type="url"
              value={form.link_url}
              onChange={(e) => setForm((prev) => ({ ...prev, link_url: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <div className="admin-span-2">
            <ImageUploadField
              label="배너 이미지 (Supabase Storage)"
              folder="home-banners"
              value={form.image_url}
              onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
              onError={(msg) => showToast(msg, 'error')}
              hint="16:9 권장 · JPG/PNG/WEBP"
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
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            앱에 노출
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

      {loading ? <p className="muted">배너 불러오는 중…</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="muted">등록된 배너가 없습니다. 상단 「+ 배너 추가」로 등록하세요.</p>
      ) : null}

      {rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>미리보기</th>
                <th>제목</th>
                <th>링크</th>
                <th>순서</th>
                <th>노출</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.image_url ? (
                      <img src={row.image_url} alt="" className="admin-thumb" />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <strong>{row.title || '제목 없음'}</strong>
                    {row.description ? <div className="muted">{row.description}</div> : null}
                  </td>
                  <td className="admin-table-url">{row.link_url || '—'}</td>
                  <td>{row.sort_order}</td>
                  <td>{row.is_active ? 'Y' : 'N'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        startEdit(row.id, {
                          title: row.title,
                          description: row.description,
                          image_url: row.image_url ?? '',
                          link_url: row.link_url,
                          sort_order: row.sort_order,
                          is_active: row.is_active,
                        });
                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
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
